export default {
  async fetch(request, env) {
    return Response.json({
      licenses_exists: !!env.LICENSES
    });
  }
}
