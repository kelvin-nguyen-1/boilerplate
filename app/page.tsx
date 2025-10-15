"use client";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./apiHandler/apiCall";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "next/navigation";
import axios from "axios";

interface Board {
  _id: string;
  id: string;
  name: string;
  type: string;
  fields: BoardField[];
}

interface BoardField {
  _id: string;
  name: string;
  type: string;
  is_identifier?: boolean;
  hidden?: boolean;
}

interface BoardItem {
  _id: string;
  board_item_id: string;
  fields: Record<string, any>;
  created_type: string;
  [key: string]: any;
}

interface PaginatedResponse<T> {
  data: T;
  count: number;
  skip: number;
  limit: number;
}

// Helper function to get authentication token from localStorage
// const getAuthToken = (token): string => {
//     return 'api_72519375-25c3-4465-8ed9-e5650e9a4efd'
//     // return window.localStorage.getItem('imbrace-access-token') || '';
// };

const ContactTest = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("ac");
  const appId = searchParams.get("t");

  // If no token or no appId, render the placeholder UI
  if (!token || !appId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] py-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to dev boilerplate!</h1>
        <div className="w-full max-w-md space-y-4">
          <Label htmlFor="temp-input">Temporary Text Input</Label>
          <Input
            id="temp-input"
            type="text"
            placeholder="Enter some text here..."
          />
          <p className="text-sm text-muted-foreground">
            This is a temporary input field. You can replace it with your
            content.
          </p>
        </div>
      </div>
    );
  }
  const [boards, setBoards] = useState<Board[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [boardItems, setBoardItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Selection states
  const [selectedRows, setSelectedRows] = useState<BoardItem[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  useEffect(() => {
    if (token) {
      console.log("Token from URL:", token);
      // Do something with the token
    }
  }, [token]);

  // Fetch all boards
  const fetchBoards = useCallback(async () => {
    setLoading(true);
    try {
      // const response = await fetch('/api/v1/board?limit=0&skip=0&sort=-created_at&is_default=false', {
      //     method: 'GET',
      //     headers: {
      //         'accept': 'application/json, text/plain, */*',
      //         'accept-language': 'en-US,en;q=0.9',
      //         'X-Access-Token': token,
      //     }
      // });

      const response = await apiRequest("GET_BOARD", {
        params: {
          limit: 0,
          skip: 0,
          sort: "-created_at",
          is_default: true,
        },
        // headers: {
        //     'x-temp-token': token,
        // },
      });

      const data = response?.data?.data;

      // Show all boards (remove type filter since response shows "General" type)
      const allBoards = data || [];

      setBoards(allBoards);
    } catch (error) {
      console.error("Error fetching boards:", error);
      setBoards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch board items for selected board with pagination
  const fetchBoardItems = useCallback(
    async (boardId: string, page: number = 1, size: number = pageSize) => {
      setLoadingItems(true);
      try {
        const skip = (page - 1) * size;
        // const response = await fetch(`/api/v1/board/${boardId}/board_items?limit=${size}&skip=${skip}`, {
        //     method: 'GET',
        //     headers: {
        //         'accept': 'application/json, text/plain, */*',
        //         'accept-language': 'en-US,en;q=0.9',
        //         'X-Access-Token': token,
        //     }
        // });
        console.log("boardId", boardId);

        const response = await apiRequest("GET_BOARD_ITEM", {
          urlParams: {
            board_id: boardId,
          },
          params: {
            limit: size,
            skip: skip,
          },
          // headers: {
          //    'x-temp-token': token,
          // },
        });

        const data = response?.data?.data;
        console.log(data);

        const processedItems = data.map((item: BoardItem) => ({
          ...item,
          id: item.board_item_id || item._id,
          ...item.fields, // Spread fields to make them accessible at top level
        }));

        setBoardItems(processedItems);
        setTotalRecords(data.count || 0); // count = total records
        setHasMore(data.has_more || false);
        setCurrentPage(page);
      } catch (error) {
        console.error("Error fetching board items:", error);
        setBoardItems([]);
        setTotalRecords(0);
        setHasMore(false);
      } finally {
        setLoadingItems(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  // Handle board selection
  const handleBoardChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const boardId = event.target.value;
      const board = boards.find((b) => b._id === boardId);

      console.log("bId", board);

      if (board) {
        setSelectedBoard(board);
        setCurrentPage(1); // Reset to first page
        setSelectedRows([]); // Clear selected rows
        setIsAllSelected(false);
        fetchBoardItems(board._id, 1, pageSize);
      } else {
        setSelectedBoard(null);
        setBoardItems([]);
        setTotalRecords(0);
        setHasMore(false);
        setCurrentPage(1);
        setSelectedRows([]);
        setIsAllSelected(false);
      }
    },
    [boards, fetchBoardItems, pageSize]
  );

  // Handle individual row selection
  const handleRowSelect = useCallback(
    (item: BoardItem, isSelected: boolean) => {
      if (isSelected) {
        setSelectedRows((prev) => [...prev, item]);
      } else {
        setSelectedRows((prev) => prev.filter((row) => row._id !== item._id));
      }
    },
    []
  );

  // Handle select all checkbox
  const handleSelectAll = useCallback(
    (isSelected: boolean) => {
      if (isSelected) {
        setSelectedRows((prev) => {
          const newItems = boardItems.filter(
            (item) => !prev.some((selected) => selected._id === item._id)
          );
          return [...prev, ...newItems];
        });
      } else {
        const currentPageIds = boardItems.map((item) => item._id);
        setSelectedRows((prev) =>
          prev.filter((row) => !currentPageIds.includes(row._id))
        );
      }
      setIsAllSelected(isSelected);
    },
    [boardItems]
  );

  // Check if item is selected
  const isRowSelected = useCallback(
    (item: BoardItem) => {
      return selectedRows.some((row) => row._id === item._id);
    },
    [selectedRows]
  );

  // Update isAllSelected when selectedRows or boardItems change
  useEffect(() => {
    if (boardItems.length === 0) {
      setIsAllSelected(false);
    } else {
      const allCurrentPageSelected = boardItems.every((item) =>
        isRowSelected(item)
      );
      setIsAllSelected(allCurrentPageSelected);
    }
  }, [boardItems, selectedRows, isRowSelected]);

  // Render table headers based on board fields
  const renderTableHeaders = () => {
    if (!selectedBoard) return null;

    const visibleFields = selectedBoard.fields.filter((field) => !field.hidden);

    return (
      <tr
        style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}
      >
        <th
          style={{
            padding: "12px",
            textAlign: "center",
            fontWeight: "bold",
            width: "50px",
          }}
        >
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
        </th>
        <th style={{ padding: "12px", textAlign: "left", fontWeight: "bold" }}>
          No.
        </th>
        {visibleFields.map((field) => (
          <th
            key={field._id}
            style={{ padding: "12px", textAlign: "left", fontWeight: "bold" }}
          >
            {field.name}
          </th>
        ))}
      </tr>
    );
  };

  // Render table rows
  const renderTableRows = () => {
    if (!selectedBoard || boardItems.length === 0) return null;

    const visibleFields = selectedBoard.fields.filter((field) => !field.hidden);

    return boardItems.map((item, index) => (
      <tr key={item._id} style={{ borderBottom: "1px solid #eee" }}>
        <td style={{ padding: "12px", textAlign: "center" }}>
          <input
            type="checkbox"
            checked={isRowSelected(item)}
            onChange={(e) => handleRowSelect(item, e.target.checked)}
            style={{ cursor: "pointer" }}
          />
        </td>
        <td style={{ padding: "12px" }}>
          {(currentPage - 1) * pageSize + index + 1}
        </td>
        {visibleFields.map((field) => {
          const value = item[field._id];
          let displayValue = "—";

          if (value !== null && value !== undefined) {
            if (typeof value === "object") {
              // Handle complex objects like Country, Phone, etc.
              if (field.type === "Country" && value.country_name) {
                displayValue = value.country_name;
              } else if (field.type === "Phone" && value.national_number) {
                displayValue = `${value.country_calling_code || ""} ${
                  value.national_number
                }`.trim();
              } else if (field.type === "Assignee" && value.display_name) {
                displayValue = value.display_name;
              } else if (Array.isArray(value)) {
                displayValue = value.length > 0 ? `${value.length} items` : "—";
              } else {
                displayValue = JSON.stringify(value);
              }
            } else {
              displayValue = String(value);
            }
          }

          return (
            <td
              key={field._id}
              style={{
                padding: "12px",
                maxWidth: "200px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayValue}
            </td>
          );
        })}
      </tr>
    ));
  };
  const mergeBoardIntoItems = (
    board: Board | null,
    boardItems: BoardItem[]
  ) => {
    return boardItems.map((item) => {
      if (item.board_id === board?._id) {
        return {
          ...item,
          board: board,
        };
      }
      return item;
    });
  };

  const mapFieldsByName = (boardItem: BoardItem, board: Board) => {
    const mapped: Record<string, any> = {};

    board.fields.forEach((field) => {
      if (boardItem.fields.hasOwnProperty(field._id)) {
        mapped[field.name] = boardItem.fields[field._id];
      }
    });

    return mapped;
  };

  const handleSubmitSelectedRows = async () => {
    if (selectedRows.length === 0) return;
    try {
      const mergedItems = mergeBoardIntoItems(selectedBoard, selectedRows);
      console.log("mergedItems", mergedItems);
      const x = mergedItems.map((item) =>
        mapFieldsByName(item, selectedBoard as Board)
      );
      console.log("mergeByNames", x);

      const currentAppInfo = await apiRequest("GET_APP_DETAIL", {
        urlParams: { id: appId },
      });

      const currentWebhookId = currentAppInfo?.data.data.webhook_id;

      const webhookUrl = 'https://org-default.dev.imbrace.co/webhook/';
      const triggerWebhook = await axios.post(`${webhookUrl}${currentWebhookId}`, x)
      console.log('triggerWebhook', triggerWebhook);
      // console.log('selectedBoard', selectedBoard);

      // console.log('selectedRows', selectedRows);

      // Example: send selected row IDs to an API endpoint
      const ids = selectedRows.map((row) => row._id);

      console.log("ids", ids);
    } catch (error) {
      alert("Error submitting selected rows: " + error);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        minHeight: "100vh",
        overflow: "auto",
        backgroundColor: "#f8f9fa",
      }}
    >
      <div
        style={{
          marginBottom: "20px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}
        >
          Board Test Component
        </h1>

        {/* Board Selection */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>
            Select Board:
          </h3>
          <select
            style={{
              width: "300px",
              padding: "8px",
              fontSize: "14px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
            disabled={loading}
            onChange={handleBoardChange}
            value={selectedBoard?._id || ""}
          >
            <option value="">
              {loading ? "Loading boards..." : "Select a board"}
            </option>
            {boards.map((board) => (
              <option key={board._id} value={board._id}>
                {board.name}
              </option>
            ))}
          </select>
        </div>

        {/* Refresh Buttons */}
        <div style={{ marginBottom: "20px" }}>
          <button
            style={{
              padding: "8px 16px",
              marginRight: "10px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
            onClick={fetchBoards}
            disabled={loading}
          >
            Refresh Boards
          </button>
          {selectedBoard && (
            <button
              style={{
                padding: "8px 16px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
              onClick={() =>
                fetchBoardItems(selectedBoard._id, currentPage, pageSize)
              }
              disabled={loadingItems}
            >
              Refresh Board Items
            </button>
          )}
        </div>

        {/* Loading state for board items */}
        {loadingItems && (
          <p style={{ fontSize: "14px", color: "#007bff" }}>
            Loading board items...
          </p>
        )}

        {/* Pagination Controls */}
        {selectedBoard &&
          !loadingItems &&
          totalRecords > 0 &&
          (() => {
            const totalPages = Math.ceil(totalRecords / pageSize);
            const maxPagesToShow = 5;
            let startPage = Math.max(
              1,
              currentPage - Math.floor(maxPagesToShow / 2)
            );
            let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

            // Adjust start page if we're near the end
            if (endPage - startPage + 1 < maxPagesToShow) {
              startPage = Math.max(1, endPage - maxPagesToShow + 1);
            }

            const pageNumbers = [];
            for (let i = startPage; i <= endPage; i++) {
              pageNumbers.push(i);
            }

            return (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "16px",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "16px",
                }}
              >
                {/* Page Info */}
                <div style={{ fontSize: "14px", color: "#666" }}>
                  Page {currentPage} of {totalPages} - Showing{" "}
                  {boardItems.length} of {totalRecords} records
                </div>

                {/* Page Size Selector */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ fontSize: "14px", color: "#666" }}>
                    Items per page:
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      const newSize = parseInt(e.target.value);
                      setPageSize(newSize);
                      setCurrentPage(1);
                      if (selectedBoard) {
                        fetchBoardItems(selectedBoard._id, 1, newSize);
                      }
                    }}
                    style={{
                      padding: "4px 8px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      fontSize: "14px",
                    }}
                    disabled={loadingItems}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                {/* Page Numbers */}
                <div
                  style={{ display: "flex", gap: "4px", alignItems: "center" }}
                >
                  {/* First page button */}
                  {startPage > 1 && (
                    <>
                      <button
                        onClick={() => {
                          if (selectedBoard) {
                            fetchBoardItems(selectedBoard._id, 1, pageSize);
                          }
                        }}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "#f8f9fa",
                          color: "#007bff",
                          border: "1px solid #dee2e6",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                        disabled={loadingItems}
                      >
                        1
                      </button>
                      {startPage > 2 && (
                        <span style={{ padding: "8px 4px", color: "#666" }}>
                          ...
                        </span>
                      )}
                    </>
                  )}

                  {/* Page numbers */}
                  {pageNumbers.map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => {
                        if (selectedBoard && pageNum !== currentPage) {
                          fetchBoardItems(selectedBoard._id, pageNum, pageSize);
                        }
                      }}
                      style={{
                        padding: "8px 12px",
                        backgroundColor:
                          pageNum === currentPage ? "#007bff" : "#f8f9fa",
                        color: pageNum === currentPage ? "white" : "#007bff",
                        border:
                          "1px solid " +
                          (pageNum === currentPage ? "#007bff" : "#dee2e6"),
                        borderRadius: "4px",
                        cursor: pageNum === currentPage ? "default" : "pointer",
                        fontSize: "14px",
                        fontWeight: pageNum === currentPage ? "bold" : "normal",
                      }}
                      disabled={loadingItems || pageNum === currentPage}
                    >
                      {pageNum}
                    </button>
                  ))}

                  {/* Last page button */}
                  {endPage < totalPages && (
                    <>
                      {endPage < totalPages - 1 && (
                        <span style={{ padding: "8px 4px", color: "#666" }}>
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => {
                          if (selectedBoard) {
                            fetchBoardItems(
                              selectedBoard._id,
                              totalPages,
                              pageSize
                            );
                          }
                        }}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "#f8f9fa",
                          color: "#007bff",
                          border: "1px solid #dee2e6",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                        disabled={loadingItems}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })()}

        {/* Data Table */}
        {selectedBoard && !loadingItems && (
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              overflow: "auto",
              backgroundColor: "white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead
                style={{ position: "sticky", top: 0, backgroundColor: "white" }}
              >
                {renderTableHeaders()}
              </thead>
              <tbody>
                {boardItems.length > 0 ? (
                  renderTableRows()
                ) : (
                  <tr>
                    <td
                      colSpan={
                        selectedBoard.fields.filter((f) => !f.hidden).length + 2
                      }
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "#666",
                      }}
                    >
                      No records found in this board
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Selected Rows List */}
        {selectedRows.length > 0 && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              backgroundColor: "white",
              borderRadius: "8px",
              border: "1px solid #e0e0e0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h3 style={{ fontSize: "16px", margin: 0, color: "#333" }}>
                Selected Rows ({selectedRows.length})
              </h3>
              <button
                onClick={() => setSelectedRows([])}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Clear All
              </button>
            </div>

            <div
              style={{
                maxHeight: "200px",
                overflow: "auto",
                border: "1px solid #dee2e6",
                borderRadius: "4px",
              }}
            >
              {selectedRows.map((row, index) => {
                // Get identifier field value (first field that is identifier or first field)
                const identifierField =
                  selectedBoard?.fields.find((f) => f.is_identifier) ||
                  selectedBoard?.fields[0];
                const displayValue = identifierField
                  ? row[identifierField._id] || row._id
                  : row._id;

                return (
                  <div
                    key={row._id}
                    style={{
                      padding: "8px 12px",
                      borderBottom:
                        index < selectedRows.length - 1
                          ? "1px solid #dee2e6"
                          : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: index % 2 === 0 ? "#f8f9fa" : "white",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>
                      {typeof displayValue === "string"
                        ? displayValue
                        : JSON.stringify(displayValue)}
                    </span>
                    <button
                      onClick={() => handleRowSelect(row, false)}
                      style={{
                        padding: "2px 6px",
                        backgroundColor: "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "2px",
                        cursor: "pointer",
                        fontSize: "10px",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleSubmitSelectedRows}
              style={{
                marginTop: "16px",
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Submit Selected Rows
            </button>
          </div>
        )}

        {/* No board selected state */}
        {!selectedBoard && !loading && (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              border: "2px dashed #ddd",
              borderRadius: "8px",
              backgroundColor: "#f9f9f9",
              color: "#666",
            }}
          >
            <p style={{ margin: 0, fontSize: "14px" }}>
              Please select a board to view its data
            </p>
          </div>
        )}
      </div>
      {/* Bottom spacing for scroll */}
      <div style={{ height: "50px" }}></div>
    </div>
  );
};

export default ContactTest;
