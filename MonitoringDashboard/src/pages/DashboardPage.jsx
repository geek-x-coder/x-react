import React, { useEffect, useMemo, useState } from "react";
import { WidthProvider, Responsive } from "react-grid-layout/legacy";
import { useNavigate } from "react-router-dom";
import { useWidgetApiData } from "../hooks/useApi";
import { useDashboardStore } from "../store/dashboardStore";
import { useAuthStore } from "../store/authStore";
import ApiCard from "../components/ApiCard";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./DashboardPage.css";

const ResponsiveGridLayout = WidthProvider(Responsive);
const MIN_WIDGET_W = 2;
const MAX_WIDGET_W = 12;
const MIN_WIDGET_H = 2;
const MAX_WIDGET_H = 24;
const DEFAULT_REFRESH_INTERVAL_SEC = 5;
const DEFAULT_WIDGET_FONT_SIZE = 13;

const DEFAULT_APIS = [
    {
        id: "api-1",
        title: "CoinTrader Status",
        endpoint: "http://localhost:5000/api/status",
        defaultLayout: {
            x: 0,
            y: 0,
            w: 4,
            h: 4,
            minW: MIN_WIDGET_W,
            minH: MIN_WIDGET_H,
        },
        refreshIntervalSec: DEFAULT_REFRESH_INTERVAL_SEC,
        tableSettings: {
            visibleColumns: [],
            columnWidths: {},
            criteria: {},
        },
    },
    {
        id: "api-2",
        title: "Application Alerts",
        endpoint: "http://localhost:5000/api/alerts",
        defaultLayout: {
            x: 4,
            y: 0,
            w: 4,
            h: 4,
            minW: MIN_WIDGET_W,
            minH: MIN_WIDGET_H,
        },
        refreshIntervalSec: DEFAULT_REFRESH_INTERVAL_SEC,
        tableSettings: {
            visibleColumns: [],
            columnWidths: {},
            criteria: {},
        },
    },
    {
        id: "api-3",
        title: "System Metrics",
        endpoint: "http://localhost:5000/api/metrics",
        defaultLayout: {
            x: 8,
            y: 0,
            w: 4,
            h: 5,
            minW: MIN_WIDGET_W,
            minH: MIN_WIDGET_H,
        },
        refreshIntervalSec: DEFAULT_REFRESH_INTERVAL_SEC,
        tableSettings: {
            visibleColumns: [],
            columnWidths: {},
            criteria: {},
        },
    },
];

const DEFAULT_WIDGET_LAYOUT = {
    x: 0,
    y: 0,
    w: 4,
    h: 4,
    minW: MIN_WIDGET_W,
    minH: MIN_WIDGET_H,
};
const GRID_COLUMNS = 12;

const clampValue = (value, min, max, fallback) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, Math.floor(numericValue)));
};

const normalizeWidgetLayout = (widget, savedLayout) => {
    const fallbackLayout = widget.defaultLayout ?? DEFAULT_WIDGET_LAYOUT;

    return {
        i: widget.id,
        ...fallbackLayout,
        ...savedLayout,
        minW:
            savedLayout?.minW ??
            fallbackLayout.minW ??
            DEFAULT_WIDGET_LAYOUT.minW,
        minH:
            savedLayout?.minH ??
            fallbackLayout.minH ??
            DEFAULT_WIDGET_LAYOUT.minH,
    };
};

const layoutArrayToMap = (layoutItems, previousLayouts = {}) => {
    return layoutItems.reduce((accumulator, item) => {
        accumulator[item.i] = {
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
            minW: previousLayouts[item.i]?.minW ?? MIN_WIDGET_W,
            minH: previousLayouts[item.i]?.minH ?? MIN_WIDGET_H,
        };
        return accumulator;
    }, {});
};

const DashboardPage = () => {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const widgets = useDashboardStore((state) => state.widgets);
    const layouts = useDashboardStore((state) => state.layouts);
    const setWidgets = useDashboardStore((state) => state.setWidgets);
    const addWidget = useDashboardStore((state) => state.addWidget);
    const removeWidget = useDashboardStore((state) => state.removeWidget);
    const updateWidget = useDashboardStore((state) => state.updateWidget);
    const saveLayout = useDashboardStore((state) => state.saveLayout);
    const saveLayouts = useDashboardStore((state) => state.saveLayouts);
    const dashboardSettings = useDashboardStore(
        (state) => state.dashboardSettings,
    );
    const setDashboardSettings = useDashboardStore(
        (state) => state.setDashboardSettings,
    );
    const exportDashboardConfig = useDashboardStore(
        (state) => state.exportDashboardConfig,
    );
    const importDashboardConfig = useDashboardStore(
        (state) => state.importDashboardConfig,
    );

    const [showAddApi, setShowAddApi] = useState(false);
    const [showDashboardSettings, setShowDashboardSettings] = useState(false);
    const [newApiForm, setNewApiForm] = useState({
        title: "",
        endpoint: "",
    });
    const [fontSizeDraft, setFontSizeDraft] = useState(
        dashboardSettings?.widgetFontSize ?? DEFAULT_WIDGET_FONT_SIZE,
    );
    const [configJsonDraft, setConfigJsonDraft] = useState("");
    const [configErrorMessage, setConfigErrorMessage] = useState("");

    useEffect(() => {
        setFontSizeDraft(
            dashboardSettings?.widgetFontSize ?? DEFAULT_WIDGET_FONT_SIZE,
        );
    }, [dashboardSettings?.widgetFontSize]);

    useEffect(() => {
        if (widgets === null) {
            setWidgets(DEFAULT_APIS);
        }
    }, [widgets, setWidgets]);

    const dashboardWidgets = widgets ?? DEFAULT_APIS;

    const { results, loadingMap, refreshingMap, refetchAll, refetchOne } =
        useWidgetApiData(dashboardWidgets);

    const gridLayout = useMemo(
        () =>
            dashboardWidgets.map((widget) =>
                normalizeWidgetLayout(widget, layouts[widget.id]),
            ),
        [dashboardWidgets, layouts],
    );

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleRemoveApi = (apiId) => {
        removeWidget(apiId);
    };

    const handleAddApi = () => {
        if (!newApiForm.title.trim() || !newApiForm.endpoint.trim()) {
            return;
        }

        const widgetId = `api-${Date.now()}`;
        const nextLayout = {
            ...DEFAULT_WIDGET_LAYOUT,
            y: dashboardWidgets.length * 4,
        };
        const newWidget = {
            id: widgetId,
            title: newApiForm.title.trim(),
            endpoint: newApiForm.endpoint.trim(),
            defaultLayout: nextLayout,
            refreshIntervalSec: DEFAULT_REFRESH_INTERVAL_SEC,
            tableSettings: {
                visibleColumns: [],
                columnWidths: {},
                criteria: {},
            },
        };

        addWidget(newWidget);
        saveLayout(widgetId, nextLayout);
        setNewApiForm({ title: "", endpoint: "" });
        setShowAddApi(false);
    };

    const handleLayoutCommit = (nextLayout) => {
        const nextLayoutMap = layoutArrayToMap(nextLayout, layouts);
        saveLayouts({ ...layouts, ...nextLayoutMap });
    };

    const handleWidgetSizeChange = (apiId, nextWidth, nextHeight) => {
        const currentLayout =
            layouts[apiId] ??
            gridLayout.find((item) => item.i === apiId) ??
            DEFAULT_WIDGET_LAYOUT;

        const width = clampValue(
            nextWidth,
            currentLayout.minW ?? MIN_WIDGET_W,
            MAX_WIDGET_W,
            currentLayout.w,
        );
        const height = clampValue(
            nextHeight,
            currentLayout.minH ?? MIN_WIDGET_H,
            MAX_WIDGET_H,
            currentLayout.h,
        );

        saveLayout(apiId, {
            ...currentLayout,
            w: width,
            h: height,
        });
    };

    const handleRefreshIntervalChange = (apiId, intervalSec) => {
        const normalizedInterval = clampValue(
            intervalSec,
            1,
            3600,
            DEFAULT_REFRESH_INTERVAL_SEC,
        );

        updateWidget(apiId, {
            refreshIntervalSec: normalizedInterval,
        });
    };

    const handleTableSettingsChange = (apiId, nextSettings) => {
        updateWidget(apiId, {
            tableSettings: nextSettings,
        });
    };

    const handleApplyDashboardSettings = () => {
        const normalizedFontSize = clampValue(
            fontSizeDraft,
            10,
            18,
            DEFAULT_WIDGET_FONT_SIZE,
        );

        setFontSizeDraft(normalizedFontSize);
        setDashboardSettings({ widgetFontSize: normalizedFontSize });
    };

    const handleExportConfig = () => {
        const exportedConfig = exportDashboardConfig();
        const prettyJson = JSON.stringify(exportedConfig, null, 2);
        setConfigJsonDraft(prettyJson);

        const blob = new Blob([prettyJson], { type: "application/json" });
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = `dashboard-config-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
    };

    const handleImportConfigFromText = () => {
        try {
            const parsed = JSON.parse(configJsonDraft);
            importDashboardConfig(parsed);
            setConfigErrorMessage("");
            setShowDashboardSettings(false);
        } catch (error) {
            setConfigErrorMessage(
                error instanceof Error
                    ? error.message
                    : "설정 JSON 파싱에 실패했습니다.",
            );
        }
    };

    const handleConfigFileChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const text = String(reader.result ?? "");
            setConfigJsonDraft(text);
        };
        reader.readAsText(file, "utf-8");
        event.target.value = "";
    };

    const getApiResult = (apiId) => results[apiId];

    const getApiData = (apiId) => {
        const apiResult = getApiResult(apiId);
        if (!apiResult) return null;
        if (apiResult.status === "error") return null;
        return apiResult.data;
    };

    return (
        <div className='dashboard-page'>
            <header className='dashboard-header'>
                <div className='header-left'>
                    <h1>📊 Monitoring Dashboard</h1>
                    <div className='header-subtitle-row'>
                        <p>Real-time Application Status & Alerts</p>
                        <span
                            className='api-count'
                            title={`위젯 ${dashboardWidgets.length}개`}
                        >
                            <span className='api-count-icon'>◫</span>
                            <span className='api-count-value'>
                                {dashboardWidgets.length}
                            </span>
                        </span>
                    </div>
                </div>

                <div className='header-right'>
                    <div className='header-info-row'>
                        <span className='header-user-id'>
                            @{user?.username || "administrator"}
                        </span>
                    </div>

                    <div className='header-controls-row'>
                        <button
                            className='toolbar-btn toolbar-btn-secondary'
                            onClick={() => setShowDashboardSettings(true)}
                            title='대시보드 설정'
                        >
                            <span className='toolbar-btn-icon'>⚙</span>
                        </button>
                        <button
                            className='toolbar-btn toolbar-btn-primary'
                            onClick={() => setShowAddApi(true)}
                            title='API 추가'
                        >
                            <span className='toolbar-btn-icon'>＋</span>
                        </button>
                        <button
                            className='toolbar-btn toolbar-btn-secondary'
                            onClick={() => refetchAll()}
                            title='전체 새로고침'
                        >
                            <span className='toolbar-btn-icon'>⟳</span>
                        </button>

                        <button
                            className='logout-btn icon'
                            onClick={handleLogout}
                            title='로그아웃'
                        >
                            ⎋
                        </button>
                    </div>
                </div>
            </header>

            {showAddApi && (
                <div
                    className='modal-overlay'
                    onClick={() => setShowAddApi(false)}
                >
                    <div
                        className='modal-content'
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className='modal-header'>
                            <h3>API 엔드포인트 추가</h3>
                            <button
                                className='close-btn'
                                onClick={() => setShowAddApi(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className='modal-body'>
                            <div className='form-group'>
                                <label htmlFor='api-title'>제목</label>
                                <input
                                    id='api-title'
                                    type='text'
                                    placeholder='예: CoinTrader Status'
                                    value={newApiForm.title}
                                    onChange={(event) =>
                                        setNewApiForm({
                                            ...newApiForm,
                                            title: event.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className='form-group'>
                                <label htmlFor='api-endpoint'>
                                    엔드포인트 URL
                                </label>
                                <input
                                    id='api-endpoint'
                                    type='text'
                                    placeholder='예: http://localhost:5000/api/status'
                                    value={newApiForm.endpoint}
                                    onChange={(event) =>
                                        setNewApiForm({
                                            ...newApiForm,
                                            endpoint: event.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className='modal-footer'>
                            <button
                                className='secondary-btn'
                                onClick={() => setShowAddApi(false)}
                            >
                                취소
                            </button>
                            <button
                                className='primary-btn'
                                onClick={handleAddApi}
                            >
                                추가
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDashboardSettings && (
                <div
                    className='modal-overlay'
                    onClick={() => setShowDashboardSettings(false)}
                >
                    <div
                        className='modal-content dashboard-settings-modal'
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className='modal-header'>
                            <h3>대시보드 설정</h3>
                            <button
                                className='close-btn'
                                onClick={() => setShowDashboardSettings(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className='modal-body'>
                            <div className='form-group'>
                                <label htmlFor='widget-font-size'>
                                    위젯 테이블 폰트 크기 (px)
                                </label>
                                <div className='inline-input-group'>
                                    <input
                                        id='widget-font-size'
                                        type='number'
                                        min='10'
                                        max='18'
                                        value={fontSizeDraft}
                                        onChange={(event) =>
                                            setFontSizeDraft(event.target.value)
                                        }
                                    />
                                    <button
                                        className='secondary-btn'
                                        onClick={handleApplyDashboardSettings}
                                    >
                                        적용
                                    </button>
                                </div>
                            </div>

                            <div className='form-group'>
                                <label htmlFor='config-file-upload'>
                                    설정 JSON 파일 로드
                                </label>
                                <input
                                    id='config-file-upload'
                                    type='file'
                                    accept='application/json,.json'
                                    onChange={handleConfigFileChange}
                                />
                            </div>

                            <div className='form-group'>
                                <label htmlFor='config-json-text'>
                                    설정 JSON 편집/붙여넣기
                                </label>
                                <textarea
                                    id='config-json-text'
                                    className='config-json-textarea'
                                    value={configJsonDraft}
                                    onChange={(event) =>
                                        setConfigJsonDraft(event.target.value)
                                    }
                                    placeholder='설정 JSON을 붙여넣거나 파일 로드 후 편집하세요.'
                                />
                                {configErrorMessage && (
                                    <p className='config-error-text'>
                                        {configErrorMessage}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className='modal-footer'>
                            <button
                                className='secondary-btn'
                                onClick={handleExportConfig}
                            >
                                JSON 저장
                            </button>
                            <button
                                className='primary-btn'
                                onClick={handleImportConfigFromText}
                                disabled={!configJsonDraft.trim()}
                            >
                                JSON 로드
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className='dashboard-content'>
                {dashboardWidgets.length === 0 ? (
                    <div className='empty-state'>
                        <div className='empty-icon'>📭</div>
                        <h2>API 엔드포인트를 추가하세요</h2>
                        <p>
                            모니터링할 REST API 엔드포인트를 추가하여 대시보드를
                            시작합니다.
                        </p>
                        <button
                            className='primary-btn'
                            onClick={() => setShowAddApi(true)}
                        >
                            API 추가
                        </button>
                    </div>
                ) : (
                    <ResponsiveGridLayout
                        className='api-grid'
                        layouts={{
                            lg: gridLayout,
                            md: gridLayout,
                            sm: gridLayout,
                            xs: gridLayout,
                            xxs: gridLayout,
                        }}
                        breakpoints={{
                            lg: 1200,
                            md: 996,
                            sm: 768,
                            xs: 480,
                            xxs: 0,
                        }}
                        cols={{
                            lg: GRID_COLUMNS,
                            md: 10,
                            sm: 6,
                            xs: 4,
                            xxs: 2,
                        }}
                        rowHeight={56}
                        margin={[20, 20]}
                        containerPadding={[0, 0]}
                        draggableHandle='.api-card-header'
                        resizeHandles={["se"]}
                        onDragStop={handleLayoutCommit}
                        onResizeStop={handleLayoutCommit}
                    >
                        {dashboardWidgets.map((widget) => {
                            const apiData = getApiData(widget.id);
                            const apiResult = getApiResult(widget.id);
                            const apiError = apiResult?.error;
                            const apiStatus = apiResult?.status ?? "loading";
                            const tableError = apiData ? null : apiError;
                            const isLoading =
                                !!loadingMap[widget.id] && !apiData;
                            const isRefreshing = !!refreshingMap[widget.id];
                            const currentLayout =
                                layouts[widget.id] ??
                                gridLayout.find((item) => item.i === widget.id);

                            return (
                                <div key={widget.id} className='grid-item'>
                                    <ApiCard
                                        apiId={widget.id}
                                        title={widget.title}
                                        endpoint={widget.endpoint}
                                        data={apiData}
                                        loading={isLoading}
                                        refreshing={isRefreshing}
                                        error={tableError}
                                        apiStatus={apiStatus}
                                        onRemove={() =>
                                            handleRemoveApi(widget.id)
                                        }
                                        onRefresh={() => refetchOne(widget.id)}
                                        currentSize={currentLayout}
                                        sizeBounds={{
                                            minW:
                                                currentLayout?.minW ??
                                                MIN_WIDGET_W,
                                            maxW: MAX_WIDGET_W,
                                            minH:
                                                currentLayout?.minH ??
                                                MIN_WIDGET_H,
                                            maxH: MAX_WIDGET_H,
                                        }}
                                        refreshIntervalSec={
                                            widget.refreshIntervalSec ??
                                            DEFAULT_REFRESH_INTERVAL_SEC
                                        }
                                        onRefreshIntervalChange={(
                                            intervalSec,
                                        ) =>
                                            handleRefreshIntervalChange(
                                                widget.id,
                                                intervalSec,
                                            )
                                        }
                                        tableSettings={widget.tableSettings}
                                        widgetFontSize={
                                            dashboardSettings?.widgetFontSize ??
                                            DEFAULT_WIDGET_FONT_SIZE
                                        }
                                        onTableSettingsChange={(nextSettings) =>
                                            handleTableSettingsChange(
                                                widget.id,
                                                nextSettings,
                                            )
                                        }
                                        onSizeChange={(nextWidth, nextHeight) =>
                                            handleWidgetSizeChange(
                                                widget.id,
                                                nextWidth,
                                                nextHeight,
                                            )
                                        }
                                    />
                                </div>
                            );
                        })}
                    </ResponsiveGridLayout>
                )}
            </div>

            <footer className='dashboard-footer'>
                <span className='footer-copyright'>
                    © 2026 Monitoring Dashboard. All rights reserved.
                </span>
                <span className='footer-version'>v0.0.1</span>
            </footer>
        </div>
    );
};

export default DashboardPage;
