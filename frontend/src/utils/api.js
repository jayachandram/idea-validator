import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 30000
});

/**
 * REQUEST INTERCEPTOR
 * Attach access token safely
 */
api.interceptors.request.use(
  (config) => {

    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


/**
 * TOKEN REFRESH LOGIC
 */

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {

  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};


/**
 * RESPONSE INTERCEPTOR
 */

api.interceptors.response.use(
  (response) => response,

  async (error) => {

    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    /**
     * Handle expired token
     */
    if (
      error.response.status === 401 &&
      error.response.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {

      if (isRefreshing) {

        return new Promise((resolve, reject) => {

          failedQueue.push({ resolve, reject });

        }).then((token) => {

          originalRequest.headers.Authorization = `Bearer ${token}`;

          return api(originalRequest);

        });

      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {

        const { data } = await axios.post(
          `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data.accessToken;

        localStorage.setItem("accessToken", newToken);

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);

      } catch (err) {

        processQueue(err, null);

        localStorage.removeItem("accessToken");

        window.location.href = "/login";

        return Promise.reject(err);

      } finally {

        isRefreshing = false;

      }
    }

    return Promise.reject(error);
  }
);

export default api;