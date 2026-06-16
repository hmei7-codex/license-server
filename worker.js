function randomKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "NEO-";

  for (let i = 0; i < 6; i++) {
    result += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return result;
}

function generateToken() {
  return Math.random().toString(36).substring(2) +
         Date.now().toString(36);
}

const ADMIN_USER = "neocloude";
const ADMIN_KEY = "NeoLaze_X9K7M2_Q8P4R6T1_2026";
const SHRINKEARN_API = env.SHRINKEARN_API;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // ==========================
    // CREATE TOKEN
    // ==========================
    if (url.pathname === "/token") {

      const token = generateToken();

      await env.TOKENS.put(
        token,
        JSON.stringify({
          created: Date.now()
        }),
        {
          expirationTtl: 3600
        }
      );

      return Response.json({
        success: true,
        token
      });
    }

    // ==========================
    // SUCCESS
    // ==========================
    if (url.pathname === "/success") {

      const token = url.searchParams.get("token");

      if (!token) {
        return Response.json({
          success: false,
          message: "Token required"
        });
      }

      const tokenData = await env.TOKENS.get(token);

      if (!tokenData) {
        return Response.json({
          success: false,
          message: "Invalid token"
        });
      }

      await env.TOKENS.delete(token);

      const key = randomKey();

      const expire = new Date(
        Date.now() + 86400000
      );

      const data = {
        status: "active",
        created: new Date().toISOString(),
        expire: expire.toISOString()
      };

      await env.LICENSES.put(
        key,
        JSON.stringify(data)
      );

      return Response.json({
        success: true,
        key,
        expire: data.expire
      });
    }
    // ==========================
    // REGISTER LICENSE
    // ==========================
    if (url.pathname === "/register") {

      const user = url.searchParams.get("user");
      const admin = url.searchParams.get("admin");

      const days = parseInt(
        url.searchParams.get("days") || "30"
      );

      if (user !== ADMIN_USER || admin !== ADMIN_KEY) {
        return Response.json({
          success: false,
          message: "Unauthorized"
        });
      }

      const key = randomKey();

      const expire = new Date(
        Date.now() + (days * 86400000)
      );

      const data = {
        status: "active",
        created: new Date().toISOString(),
        expire: expire.toISOString()
      };

      await env.LICENSES.put(
        key,
        JSON.stringify(data)
      );

      return Response.json({
        success: true,
        key,
        status: data.status,
        expire: data.expire
      });
    }

    // ==========================
    // DISABLE LICENSE
    // ==========================
    if (url.pathname === "/disable") {

      const user = url.searchParams.get("user");
      const admin = url.searchParams.get("admin");
      const key = url.searchParams.get("key");

      if (user !== ADMIN_USER || admin !== ADMIN_KEY) {
        return Response.json({
          success: false,
          message: "Unauthorized"
        });
      }

      const raw = await env.LICENSES.get(key);

      if (!raw) {
        return Response.json({
          success: false,
          message: "License not found"
        });
      }

      const license = JSON.parse(raw);

      license.status = "inactive";

      await env.LICENSES.put(
        key,
        JSON.stringify(license)
      );

      return Response.json({
        success: true,
        key,
        status: "inactive"
      });
    }

    // ==========================
    // INFO LICENSE
    // ==========================
    if (url.pathname === "/info") {

      const user = url.searchParams.get("user");
      const admin = url.searchParams.get("admin");
      const key = url.searchParams.get("key");

      if (user !== ADMIN_USER || admin !== ADMIN_KEY) {
        return Response.json({
          success: false,
          message: "Unauthorized"
        });
      }

      const raw = await env.LICENSES.get(key);

      if (!raw) {
        return Response.json({
          success: false,
          message: "License not found"
        });
      }

      const license = JSON.parse(raw);

      return Response.json({
        success: true,
        key,
        ...license
      });
    }

    // ==========================
    // CHECK LICENSE
    // ==========================
    const key = url.searchParams.get("key");

    if (!key) {
      return Response.json({
        valid: false,
        message: "License key required"
      });
    }

    const raw = await env.LICENSES.get(key);

    if (!raw) {
      return Response.json({
        valid: false,
        message: "License not found"
      });
    }

    const license = JSON.parse(raw);

    if (license.status !== "active") {
      return Response.json({
        valid: false,
        message: "License inactive"
      });
    }

    const now = Date.now();
    const expire = new Date(
      license.expire
    ).getTime();

    if (expire <= now) {
      return Response.json({
        valid: false,
        message: "License expired"
      });
    }

    const remainingSeconds =
      Math.floor((expire - now) / 1000);

    const days = Math.floor(
      remainingSeconds / 86400
    );

    const hours = Math.floor(
      (remainingSeconds % 86400) / 3600
    );

    const minutes = Math.floor(
      (remainingSeconds % 3600) / 60
    );

    const seconds =
      remainingSeconds % 60;

    return Response.json({
      valid: true,
      key,
      status: license.status,
      created: license.created,
      expire: license.expire,
      remaining: {
        days,
        hours,
        minutes,
        seconds
      }
    });
  }
};

