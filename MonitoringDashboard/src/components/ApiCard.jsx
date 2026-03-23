import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
    countRowsMatchingCriteria,
    getEnabledCriteriaColumns,
} from "../utils/helpers";
import DynamicTable from "./DynamicTable";
import "./ApiCard.css";

const clamp = (value, min, max, fallback) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, Math.floor(numericValue)));
};

const normalizeData = (rawData) => {
    if (Array.isArray(rawData)) {
        return rawData;
    }

    if (typeof rawData === "object" && rawData !== null) {
        return Object.keys(rawData).map((key) => ({
            _key: key,
            ...rawData[key],
        }));
    }

    return [];
};

const getAllColumns = (rawData) => {
    const rows = normalizeData(rawData);
    const columnSet = new Set();

    rows.forEach((row) => {
        if (typeof row === "object" && row !== null) {
            Object.keys(row).forEach((key) => {
                if (!key.startsWith("_")) {
                    columnSet.add(key);
                }
            });
        }
    });

    return Array.from(columnSet);
};

const ApiCard = ({
    apiId,
    title,
    endpoint,
    data,
    loading,
    refreshing,
    error,
    apiStatus,
    onRemove,
    onRefresh,
    currentSize,
    sizeBounds,
    onSizeChange,
    refreshIntervalSec,
    onRefreshIntervalChange,
    widgetFontSize,
    tableSettings,
    onTableSettingsChange,
}) => {
    const [showSettings, setShowSettings] = useState(false);
    const [sizeDraft, setSizeDraft] = useState({ w: 4, h: 4 });
    const [intervalDraft, setIntervalDraft] = useState(refreshIntervalSec ?? 5);
    const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
    const [selectedRow, setSelectedRow] = useState(null);
    const [clipboardRow, setClipboardRow] = useState(null);
    const [showAlertsOnly, setShowAlertsOnly] = useState(false);

    const dataRows = useMemo(() => normalizeData(data), [data]);
    const detectedColumns = useMemo(() => getAllColumns(data), [data]);
    const savedVisibleColumns = tableSettings?.visibleColumns ?? [];
    const availableColumns = useMemo(() => {
        const mergedColumns = new Set([
            ...savedVisibleColumns,
            ...detectedColumns,
        ]);
        return Array.from(mergedColumns);
    }, [detectedColumns, savedVisibleColumns]);

    useEffect(() => {
        if (
            availableColumns.length > 0 &&
            (!tableSettings?.visibleColumns ||
                tableSettings.visibleColumns.length === 0)
        ) {
            onTableSettingsChange({ visibleColumns: availableColumns });
        }
    }, [
        availableColumns,
        onTableSettingsChange,
        tableSettings?.visibleColumns,
    ]);

    const visibleColumns =
        tableSettings?.visibleColumns && tableSettings.visibleColumns.length > 0
            ? tableSettings.visibleColumns.filter((column) =>
                  availableColumns.includes(column),
              )
            : availableColumns;

    useEffect(() => {
        setSizeDraft({
            w: currentSize?.w ?? 4,
            h: currentSize?.h ?? 4,
        });
    }, [currentSize?.w, currentSize?.h]);

    useEffect(() => {
        setIntervalDraft(refreshIntervalSec ?? 5);
    }, [refreshIntervalSec]);

    useEffect(() => {
        if (data != null) {
            setLastUpdatedAt(new Date());
        }
    }, [data]);

    const formatInterval = (sec) => {
        if (sec >= 3600) return `every ${Math.floor(sec / 3600)}h`;
        if (sec >= 60) return `every ${Math.floor(sec / 60)}m`;
        return `every ${sec}s`;
    };

    const formatLocalTime = (date) => {
        if (!date) return null;
        return date.toLocaleTimeString("ko-KR", { hour12: false });
    };

    const columnWidths = tableSettings?.columnWidths ?? {};
    const criteriaMap = tableSettings?.criteria ?? {};
    const rowCount = dataRows.length;
    const enabledCriteriaColumns = useMemo(
        () => getEnabledCriteriaColumns(criteriaMap),
        [criteriaMap],
    );

    const alertCount = useMemo(() => {
        if (enabledCriteriaColumns.length === 0 || dataRows.length === 0) {
            return 0;
        }

        return countRowsMatchingCriteria(dataRows, criteriaMap);
    }, [criteriaMap, dataRows, enabledCriteriaColumns.length]);

    useEffect(() => {
        if (alertCount === 0) {
            setShowAlertsOnly(false);
        }
    }, [alertCount]);

    useEffect(() => {
        if (enabledCriteriaColumns.length === 0) {
            setShowAlertsOnly(false);
        }
    }, [enabledCriteriaColumns.length]);

    const statusLabel = loading
        ? "loading"
        : apiStatus === "dead"
          ? "dead"
          : "live";

    const handleColumnToggle = (column) => {
        const nextVisibleColumns = visibleColumns.includes(column)
            ? visibleColumns.filter((item) => item !== column)
            : [...visibleColumns, column];

        onTableSettingsChange({ visibleColumns: nextVisibleColumns });
    };

    const handleColumnWidthChange = (column, width) => {
        const nextWidth = Number(width);
        onTableSettingsChange({
            columnWidths: {
                ...columnWidths,
                [column]: Number.isNaN(nextWidth) ? 140 : nextWidth,
            },
        });
    };

    const handleCriteriaChange = (column, patch) => {
        const nextCriteria = {
            ...criteriaMap,
            [column]: {
                enabled: criteriaMap[column]?.enabled ?? false,
                operator: criteriaMap[column]?.operator ?? ">=",
                value: criteriaMap[column]?.value ?? "",
                ...patch,
            },
        };

        onTableSettingsChange({ criteria: nextCriteria });
    };

    const handleSizeApply = () => {
        const minW = sizeBounds?.minW ?? 2;
        const maxW = sizeBounds?.maxW ?? 12;
        const minH = sizeBounds?.minH ?? 2;
        const maxH = sizeBounds?.maxH ?? 24;

        const nextWidth = clamp(
            sizeDraft.w,
            minW,
            maxW,
            currentSize?.w ?? minW,
        );
        const nextHeight = clamp(
            sizeDraft.h,
            minH,
            maxH,
            currentSize?.h ?? minH,
        );

        setSizeDraft({ w: nextWidth, h: nextHeight });
        onSizeChange(nextWidth, nextHeight);
    };

    const handleIntervalApply = () => {
        const nextInterval = clamp(intervalDraft, 1, 3600, 5);
        setIntervalDraft(nextInterval);
        onRefreshIntervalChange(nextInterval);
    };

    // Ctrl+C: 단일 클릭으로 선택된 행을 헤더 포함 TSV로 클립보드에 복사
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "c" && clipboardRow) {
                const headers = visibleColumns.filter(
                    (c) => !c.startsWith("_"),
                );
                const values = headers.map((h) => {
                    const v = clipboardRow[h];
                    if (v === null || v === undefined) return "";
                    if (typeof v === "object") return JSON.stringify(v);
                    return String(v);
                });
                const tsv = headers.join("\t") + "\n" + values.join("\t");
                navigator.clipboard.writeText(tsv).catch(() => {});
                e.preventDefault();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [clipboardRow, visibleColumns]);

    // 선택된 행의 최신 데이터를 실시간으로 추적
    const liveSelectedRow = useMemo(() => {
        if (!selectedRow) return null;
        // _key 기준으로 매칭, 없으면 인덱스 기준
        if (selectedRow._key !== undefined) {
            return (
                dataRows.find((r) => r._key === selectedRow._key) ?? selectedRow
            );
        }
        const idx = dataRows.findIndex((r) =>
            Object.keys(selectedRow).every((k) => r[k] === selectedRow[k]),
        );
        return idx >= 0 ? dataRows[idx] : selectedRow;
    }, [selectedRow, dataRows]);

    const renderDetailValue = (value) => {
        if (value === null || value === undefined)
            return <span className='detail-null'>—</span>;
        if (typeof value === "boolean")
            return (
                <span
                    className={value ? "detail-bool-true" : "detail-bool-false"}
                >
                    {value ? "true" : "false"}
                </span>
            );
        if (typeof value === "object")
            return (
                <pre className='detail-json'>
                    {JSON.stringify(value, null, 2)}
                </pre>
            );
        if (typeof value === "number")
            return (
                <span className='detail-number'>{value.toLocaleString()}</span>
            );
        return <span className='detail-string'>{String(value)}</span>;
    };

    const rowDetailPopup = liveSelectedRow
        ? createPortal(
              <div
                  className='row-detail-overlay'
                  onClick={() => setSelectedRow(null)}
              >
                  <div
                      className='row-detail-popup'
                      onClick={(e) => e.stopPropagation()}
                  >
                      <div className='row-detail-header'>
                          <div>
                              <h5>Row Detail</h5>
                              <p>{title}</p>
                          </div>
                          <button
                              type='button'
                              className='close-settings-btn'
                              onClick={() => setSelectedRow(null)}
                          >
                              ✕
                          </button>
                      </div>
                      <div className='row-detail-body'>
                          <table className='row-detail-table'>
                              <tbody>
                                  {Object.entries(liveSelectedRow)
                                      .filter(([k]) => !k.startsWith("_"))
                                      .map(([key, value]) => (
                                          <tr
                                              key={key}
                                              className='row-detail-row'
                                          >
                                              <td className='row-detail-key'>
                                                  {key}
                                              </td>
                                              <td className='row-detail-val'>
                                                  {renderDetailValue(value)}
                                              </td>
                                          </tr>
                                      ))}
                              </tbody>
                          </table>
                      </div>
                      <div className='row-detail-footer'>
                          <span className='row-detail-live-indicator'>
                              <span className='live-dot' />
                              실시간 반영 중
                          </span>
                      </div>
                  </div>
              </div>,
              document.body,
          )
        : null;

    const settingsPopup = showSettings ? (
        <div
            className='settings-overlay'
            onClick={() => setShowSettings(false)}
        >
            <div
                className='settings-popup'
                onClick={(event) => event.stopPropagation()}
            >
                <div className='settings-popup-header'>
                    <div>
                        <h5>위젯 설정</h5>
                        <p>{title}</p>
                    </div>
                    <button
                        type='button'
                        className='close-settings-btn'
                        onClick={() => setShowSettings(false)}
                    >
                        ✕
                    </button>
                </div>

                <div className='settings-popup-body'>
                    <div className='settings-section'>
                        <h6>위젯 크기</h6>
                        <div className='size-editor'>
                            <label>
                                Width
                                <input
                                    type='number'
                                    min={sizeBounds?.minW ?? 2}
                                    max={sizeBounds?.maxW ?? 12}
                                    value={sizeDraft.w}
                                    onChange={(event) =>
                                        setSizeDraft((previousDraft) => ({
                                            ...previousDraft,
                                            w: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                            <label>
                                Height
                                <input
                                    type='number'
                                    min={sizeBounds?.minH ?? 2}
                                    max={sizeBounds?.maxH ?? 24}
                                    value={sizeDraft.h}
                                    onChange={(event) =>
                                        setSizeDraft((previousDraft) => ({
                                            ...previousDraft,
                                            h: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                            <button
                                type='button'
                                className='size-preset-btn'
                                onClick={handleSizeApply}
                            >
                                적용
                            </button>
                        </div>
                    </div>

                    <div className='settings-section'>
                        <h6>API 리프레시 주기 (초)</h6>
                        <div className='refresh-interval-editor'>
                            <input
                                type='number'
                                min='1'
                                max='3600'
                                value={intervalDraft}
                                onChange={(event) =>
                                    setIntervalDraft(event.target.value)
                                }
                            />
                            <button
                                type='button'
                                className='size-preset-btn'
                                onClick={handleIntervalApply}
                            >
                                적용
                            </button>
                        </div>
                    </div>

                    <div className='settings-section'>
                        <h6>컬럼 표시 및 너비</h6>
                        <div className='column-settings-list'>
                            {availableColumns.map((column) => (
                                <div
                                    key={column}
                                    className='column-setting-row'
                                >
                                    <label className='column-toggle'>
                                        <input
                                            type='checkbox'
                                            checked={visibleColumns.includes(
                                                column,
                                            )}
                                            onChange={() =>
                                                handleColumnToggle(column)
                                            }
                                        />
                                        <span>{column}</span>
                                    </label>

                                    <div className='column-width-controls'>
                                        <input
                                            type='range'
                                            min='80'
                                            max='420'
                                            step='10'
                                            value={columnWidths[column] ?? 140}
                                            onChange={(event) =>
                                                handleColumnWidthChange(
                                                    column,
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <input
                                            type='number'
                                            min='80'
                                            max='420'
                                            step='10'
                                            value={columnWidths[column] ?? 140}
                                            onChange={(event) =>
                                                handleColumnWidthChange(
                                                    column,
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <span>px</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className='settings-section'>
                        <h6>이상 감지 Criteria (컬럼별)</h6>
                        <div className='criteria-settings-list'>
                            {availableColumns.map((column) => {
                                const criteria = criteriaMap[column] ?? {
                                    enabled: false,
                                    operator: ">=",
                                    value: "",
                                };

                                return (
                                    <div
                                        key={`${column}-criteria`}
                                        className='criteria-setting-row'
                                    >
                                        <label className='criteria-column-label'>
                                            <input
                                                type='checkbox'
                                                checked={!!criteria.enabled}
                                                onChange={(event) =>
                                                    handleCriteriaChange(
                                                        column,
                                                        {
                                                            enabled:
                                                                event.target
                                                                    .checked,
                                                        },
                                                    )
                                                }
                                            />
                                            <span>{column}</span>
                                        </label>

                                        <select
                                            value={criteria.operator ?? ">="}
                                            onChange={(event) =>
                                                handleCriteriaChange(column, {
                                                    operator:
                                                        event.target.value,
                                                })
                                            }
                                        >
                                            <option value='>'>&gt;</option>
                                            <option value='>='>&gt;=</option>
                                            <option value='<'>&lt;</option>
                                            <option value='<='>&lt;=</option>
                                            <option value='=='>==</option>
                                            <option value='!='>!=</option>
                                            <option value='contains'>
                                                contains
                                            </option>
                                            <option value='not_contains'>
                                                not_contains
                                            </option>
                                        </select>

                                        <input
                                            type='text'
                                            value={criteria.value ?? ""}
                                            onChange={(event) =>
                                                handleCriteriaChange(column, {
                                                    value: event.target.value,
                                                })
                                            }
                                            placeholder='임계값'
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <div className='api-card'>
            <div className='api-card-header'>
                <div className='api-card-title-section'>
                    <div className='api-card-title-row'>
                        <h4 title={title}>{title}</h4>
                        <span className='title-meta title-meta-rows'>
                            {rowCount} rows
                        </span>
                        <span className={`status-pill ${statusLabel}`}>
                            <span className='status-dot' />
                            {statusLabel}
                        </span>
                        {enabledCriteriaColumns.length > 0 && (
                            <button
                                type='button'
                                className={`alert-pill ${alertCount > 0 ? "has-alert" : "no-alert"}`}
                                title={`Criteria 조건 충족 row: ${alertCount}`}
                                onClick={() => {
                                    if (alertCount > 0) {
                                        setShowAlertsOnly(
                                            (previous) => !previous,
                                        );
                                    }
                                }}
                                aria-pressed={showAlertsOnly}
                                disabled={alertCount === 0}
                            >
                                ALERT {alertCount}
                                {showAlertsOnly ? " · ON" : ""}
                            </button>
                        )}
                        <div className='title-actions'>
                            <button
                                type='button'
                                className='compact-icon-btn'
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onRefresh();
                                }}
                                title='새로고침'
                            >
                                ⟳
                            </button>
                            <button
                                type='button'
                                className='compact-icon-btn'
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setShowSettings(true);
                                }}
                                title='설정'
                            >
                                ⚙
                            </button>
                            <button
                                type='button'
                                className='compact-icon-btn remove'
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onRemove();
                                }}
                                title='제거'
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    <div className='api-endpoint-row'>
                        <div className='api-endpoint-info'>
                            <span className='api-endpoint'>{endpoint}</span>
                            <span className='refresh-interval-chip'>
                                ⏱ {formatInterval(refreshIntervalSec ?? 5)}
                            </span>
                        </div>
                        {lastUpdatedAt && (
                            <span className='last-updated-time'>
                                {formatLocalTime(lastUpdatedAt)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {settingsPopup && createPortal(settingsPopup, document.body)}
            {rowDetailPopup}

            <div className='api-card-content'>
                <DynamicTable
                    data={data}
                    title=''
                    columns={visibleColumns}
                    columnWidths={columnWidths}
                    criteria={criteriaMap}
                    showAlertsOnly={showAlertsOnly}
                    fontSize={widgetFontSize}
                    loading={loading}
                    error={error}
                    maxRows={20}
                    showHeader={false}
                    onRowClick={(row) => setClipboardRow(row)}
                    onRowDoubleClick={(row) => setSelectedRow(row)}
                />
            </div>
        </div>
    );
};

export default ApiCard;
