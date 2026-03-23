import { useState, useEffect, useRef, useCallback } from "react";
import { dashboardService } from "../services/api";

export const useApiData = (endpoint, interval = null) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        const isInitialRequest = data === null;

        try {
            if (isInitialRequest) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            const response = await dashboardService.getApiData("", endpoint);
            setData(response);
            setError(null);
        } catch (err) {
            setError(err.message);
            if (isInitialRequest) {
                setData(null);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();

        if (interval) {
            const timer = setInterval(fetchData, interval);
            return () => clearInterval(timer);
        }
    }, [endpoint, interval]);

    return { data, loading, refreshing, error, refetch: fetchData };
};

export const useMultipleApiData = (endpoints, interval = null) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        const isInitialRequest = data.length === 0;

        try {
            if (isInitialRequest) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }

            const results =
                await dashboardService.getMultipleApiData(endpoints);

            setData((previousData) => {
                if (previousData.length === 0) {
                    return results;
                }

                return results.map((result) => {
                    const previousResult = previousData.find(
                        (item) => item.id === result.id,
                    );

                    if (
                        result.status === "error" &&
                        previousResult?.data !== undefined
                    ) {
                        return {
                            ...previousResult,
                            status: "stale",
                            error: result.error,
                        };
                    }

                    return result;
                });
            });
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (endpoints.length > 0) {
            fetchData();

            if (interval) {
                const timer = setInterval(fetchData, interval);
                return () => clearInterval(timer);
            }
        }
    }, [endpoints.length, interval]);

    return { data, loading, refreshing, error, refetch: fetchData };
};

const clampIntervalSec = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return 5;
    }
    return Math.min(3600, Math.max(1, Math.floor(numericValue)));
};

export const useWidgetApiData = (widgets) => {
    const [results, setResults] = useState({});
    const [loadingMap, setLoadingMap] = useState({});
    const [refreshingMap, setRefreshingMap] = useState({});

    const timersRef = useRef({});
    const scheduleKeyRef = useRef({});
    const inFlightRef = useRef({});
    const widgetsRef = useRef(widgets);
    const resultsRef = useRef(results);

    useEffect(() => {
        widgetsRef.current = widgets;
    }, [widgets]);

    useEffect(() => {
        resultsRef.current = results;
    }, [results]);

    const fetchWidget = useCallback(async (widget) => {
        const widgetId = widget.id;
        if (!widgetId || !widget.endpoint) {
            return;
        }

        if (inFlightRef.current[widgetId]) {
            return inFlightRef.current[widgetId];
        }

        const hasPreviousData =
            resultsRef.current[widgetId]?.data !== undefined &&
            resultsRef.current[widgetId]?.data !== null;

        if (hasPreviousData) {
            setRefreshingMap((previousMap) => ({
                ...previousMap,
                [widgetId]: true,
            }));
        } else {
            setLoadingMap((previousMap) => ({
                ...previousMap,
                [widgetId]: true,
            }));
        }

        const requestPromise = dashboardService
            .getApiData(widgetId, widget.endpoint)
            .then((data) => {
                setResults((previousResults) => ({
                    ...previousResults,
                    [widgetId]: {
                        id: widgetId,
                        data,
                        status: "live",
                        error: null,
                        lastUpdatedAt: Date.now(),
                    },
                }));
            })
            .catch((error) => {
                setResults((previousResults) => {
                    const previousResult = previousResults[widgetId];

                    if (previousResult?.data !== undefined) {
                        return {
                            ...previousResults,
                            [widgetId]: {
                                ...previousResult,
                                status: "dead",
                                error: error.message,
                            },
                        };
                    }

                    return {
                        ...previousResults,
                        [widgetId]: {
                            id: widgetId,
                            data: null,
                            status: "dead",
                            error: error.message,
                            lastUpdatedAt: null,
                        },
                    };
                });
            })
            .finally(() => {
                setLoadingMap((previousMap) => ({
                    ...previousMap,
                    [widgetId]: false,
                }));
                setRefreshingMap((previousMap) => ({
                    ...previousMap,
                    [widgetId]: false,
                }));
                delete inFlightRef.current[widgetId];
            });

        inFlightRef.current[widgetId] = requestPromise;
        return requestPromise;
    }, []);

    useEffect(() => {
        const widgetIds = new Set(widgets.map((widget) => widget.id));

        Object.keys(timersRef.current).forEach((widgetId) => {
            if (!widgetIds.has(widgetId)) {
                clearInterval(timersRef.current[widgetId]);
                delete timersRef.current[widgetId];
                delete scheduleKeyRef.current[widgetId];
                delete inFlightRef.current[widgetId];
            }
        });

        widgets.forEach((widget) => {
            const intervalSec = clampIntervalSec(
                widget.refreshIntervalSec ?? 5,
            );
            const scheduleKey = `${widget.endpoint}::${intervalSec}`;

            if (scheduleKeyRef.current[widget.id] === scheduleKey) {
                if (!resultsRef.current[widget.id]) {
                    fetchWidget(widget);
                }
                return;
            }

            if (timersRef.current[widget.id]) {
                clearInterval(timersRef.current[widget.id]);
            }

            scheduleKeyRef.current[widget.id] = scheduleKey;
            fetchWidget(widget);

            timersRef.current[widget.id] = setInterval(() => {
                fetchWidget(widget);
            }, intervalSec * 1000);
        });

        return () => {
            Object.values(timersRef.current).forEach((timerId) => {
                clearInterval(timerId);
            });
            timersRef.current = {};
            scheduleKeyRef.current = {};
            inFlightRef.current = {};
        };
    }, [widgets, fetchWidget]);

    const refetchAll = useCallback(async () => {
        const targetWidgets = widgetsRef.current;
        await Promise.all(targetWidgets.map((widget) => fetchWidget(widget)));
    }, [fetchWidget]);

    const refetchOne = useCallback(
        async (widgetId) => {
            const targetWidget = widgetsRef.current.find(
                (widget) => widget.id === widgetId,
            );
            if (!targetWidget) {
                return;
            }
            await fetchWidget(targetWidget);
        },
        [fetchWidget],
    );

    return {
        results,
        loadingMap,
        refreshingMap,
        refetchAll,
        refetchOne,
    };
};
