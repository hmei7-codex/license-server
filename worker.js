export default {
  async fetch(request, env) {
    const data = await env.LICENSES.get("test");

    return Response.json({
      licenses_exists: !!env.LICENSES,
      test_value: data
    });
  }
}
