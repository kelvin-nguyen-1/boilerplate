export const API_ENDPOINTS = {
    GET_APP_DETAIL: {
      url: "api/proxy/journeys/v2/apps/:id",
      method: "GET" as const,
    },
    GET_BOARD_DETAIL: {
      url: "api/proxy/journeys/v1/board/:id",
      method: "GET" as const,
    },
    GET_BOARD: {
      url: "api/proxy/journeys/v1/board",
      method: "GET" as const,
    },
    GET_BOARD_ITEM: {
      url: "api/proxy/journeys/v1/board/:board_id/board_items",
      method: "GET" as const,
    },
    GET_WORKFLOW: {
      url: "api/proxy/v1/backend/ips/workflows/:workflow_id",
      method: "GET" as const,
    }
}