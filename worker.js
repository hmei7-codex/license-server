function randomKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "NEO-";

  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ===== REGISTER LICENSE =====
    if (url.pathname === "/register") {

      const admin = url.searchParams.get("admin");
      const days = parseInt(url.searchParams.get("days") || "30");

      if (admin !== "NEOADMIN123") {
        return Response.json({
          success: false,
          message: "Unauthorized"
        });
      }

      const key = randomKey();

      const expire = new Date();
      expire.setDate(expire.getDate() + days);

      const data = {
        status: "active",
        expire: expire.toISOString().split("T")[0]
      };

      await env.LICENSES.put(
        key,
        JSON.stringify(data)
      );

      return Response.json({
        success: true,
        key,
        ...data
      });
    }

    // ===== CHECK LICENSE =====
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

    const today = new Date();
    const expire = new Date(license.expire);

    if (expire < today) {
      return Response.json({
        valid: false,
        message: "License expired"
      });
    }

    return Response.json({
      valid: true,
      license
    });
  }
}
