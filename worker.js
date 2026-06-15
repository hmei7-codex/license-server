export default {
  async fetch(request, env) {
    try {
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

        return Response.json({
          success: true,
          license,
          raw
        });
      }

      return new Response("NeoCloud License Server");
    } catch (e) {
      return new Response(
        "ERROR: " + e.message,
        { status: 500 }
      );
    }
  }
}
