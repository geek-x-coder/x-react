import { create } from "zustand";

export const useDashboardStore = create((set) => {
    const WIDGETS_STORAGE_KEY = "dashboard_widgets";
    const LAYOUTS_STORAGE_KEY = "dashboard_layouts";
    const DASHBOARD_SETTINGS_STORAGE_KEY = "dashboard_settings";
    const DEFAULT_DASHBOARD_SETTINGS = {
        widgetFontSize: 13,
    };

    const loadWidgetsFromStorage = () => {
        try {
            const stored = localStorage.getItem(WIDGETS_STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    };

    // 로컬 스토리지에서 초기 설정 로드
    const loadLayoutsFromStorage = () => {
        try {
            const stored = localStorage.getItem(LAYOUTS_STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    };

    const loadDashboardSettingsFromStorage = () => {
        try {
            const stored = localStorage.getItem(DASHBOARD_SETTINGS_STORAGE_KEY);
            const parsed = stored ? JSON.parse(stored) : {};
            return {
                ...DEFAULT_DASHBOARD_SETTINGS,
                ...parsed,
            };
        } catch {
            return { ...DEFAULT_DASHBOARD_SETTINGS };
        }
    };

    return {
        widgets: loadWidgetsFromStorage(),
        layouts: loadLayoutsFromStorage(),
        dashboardSettings: loadDashboardSettingsFromStorage(),

        setWidgets: (widgets) => {
            localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
            set({ widgets });
        },

        addWidget: (widget) => {
            set((state) => {
                const widgets = [...(state.widgets ?? []), widget];
                localStorage.setItem(
                    WIDGETS_STORAGE_KEY,
                    JSON.stringify(widgets),
                );
                return { widgets };
            });
        },

        updateWidget: (widgetId, updates) => {
            set((state) => {
                const widgets = (state.widgets ?? []).map((widget) =>
                    widget.id === widgetId
                        ? {
                              ...widget,
                              ...updates,
                              tableSettings: {
                                  ...widget.tableSettings,
                                  ...updates.tableSettings,
                              },
                          }
                        : widget,
                );

                localStorage.setItem(
                    WIDGETS_STORAGE_KEY,
                    JSON.stringify(widgets),
                );

                return { widgets };
            });
        },

        removeWidget: (widgetId) => {
            set((state) => {
                const widgets = (state.widgets ?? []).filter(
                    (widget) => widget.id !== widgetId,
                );
                const layouts = Object.fromEntries(
                    Object.entries(state.layouts).filter(
                        ([key]) => key !== widgetId,
                    ),
                );

                localStorage.setItem(
                    WIDGETS_STORAGE_KEY,
                    JSON.stringify(widgets),
                );
                localStorage.setItem(
                    LAYOUTS_STORAGE_KEY,
                    JSON.stringify(layouts),
                );

                return { widgets, layouts };
            });
        },

        // 특정 API의 레이아웃 설정 저장
        saveLayout: (apiId, layout) => {
            set((state) => {
                const newLayouts = {
                    ...state.layouts,
                    [apiId]: layout,
                };
                localStorage.setItem(
                    LAYOUTS_STORAGE_KEY,
                    JSON.stringify(newLayouts),
                );
                return { layouts: newLayouts };
            });
        },

        saveLayouts: (layoutMap) => {
            localStorage.setItem(
                LAYOUTS_STORAGE_KEY,
                JSON.stringify(layoutMap),
            );
            set({ layouts: layoutMap });
        },

        setDashboardSettings: (nextSettings) => {
            set((state) => {
                const merged = {
                    ...state.dashboardSettings,
                    ...nextSettings,
                };
                localStorage.setItem(
                    DASHBOARD_SETTINGS_STORAGE_KEY,
                    JSON.stringify(merged),
                );
                return { dashboardSettings: merged };
            });
        },

        exportDashboardConfig: () => {
            const state = useDashboardStore.getState();
            return {
                version: "1.0.0",
                exportedAt: new Date().toISOString(),
                widgets: state.widgets ?? [],
                layouts: state.layouts ?? {},
                dashboardSettings:
                    state.dashboardSettings ?? DEFAULT_DASHBOARD_SETTINGS,
            };
        },

        importDashboardConfig: (config) => {
            if (!config || typeof config !== "object") {
                throw new Error("유효하지 않은 설정 JSON입니다.");
            }

            const widgets = Array.isArray(config.widgets) ? config.widgets : [];
            const layouts =
                config.layouts && typeof config.layouts === "object"
                    ? config.layouts
                    : {};
            const dashboardSettings = {
                ...DEFAULT_DASHBOARD_SETTINGS,
                ...(config.dashboardSettings ?? {}),
            };

            localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
            localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(layouts));
            localStorage.setItem(
                DASHBOARD_SETTINGS_STORAGE_KEY,
                JSON.stringify(dashboardSettings),
            );

            set({
                widgets,
                layouts,
                dashboardSettings,
            });
        },

        // 특정 API의 레이아웃 설정 조회
        getLayout: (apiId) => {
            const state = useDashboardStore.getState();
            return state.layouts[apiId] || null;
        },

        // 모든 레이아웃 설정 삭제
        clearLayouts: () => {
            localStorage.removeItem(LAYOUTS_STORAGE_KEY);
            set({ layouts: {} });
        },

        // 레이아웃 설정 업데이트
        updateLayout: (apiId, layout) => {
            set((state) => {
                const newLayouts = {
                    ...state.layouts,
                    [apiId]: { ...state.layouts[apiId], ...layout },
                };
                localStorage.setItem(
                    LAYOUTS_STORAGE_KEY,
                    JSON.stringify(newLayouts),
                );
                return { layouts: newLayouts };
            });
        },
    };
});
