export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/check") {
      const license = url.searchParams.get("license");

      if (!license) {
        return Response.json({
          success: false,
          message: "license required"
        });
      }

      const raw = await env.LICENSES.get(license);

      if (!raw) {
        return Response.json({
          success: false,
          message: "license not found"
        });
      }

      const data = JSON.parse(raw);

      return Response.json({
        success: true,
        license,
        status: data.status,
        expire: data.expire
      });
    }

    return new Response("NeoCloud License Server v2");
  }
}
