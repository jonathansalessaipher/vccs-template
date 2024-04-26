using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using VCCS.Api.Hubs.VCCSHub;

namespace VCCS.Api.Configurations.Setup
{
    public static class VCCSHubSetup
    {
        public static IServiceCollection AddVCCSHub(this IServiceCollection service)
        {
            //service.AddScoped<ISupervisorHubMessageService, SupervisorHubMessageService>();
            return service;
        }

        public static IApplicationBuilder UseVCCSHub(this IApplicationBuilder app)
        {
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapHub<VCCSHub>("/vccsHub");
            });

            return app;
        }
    }
}
