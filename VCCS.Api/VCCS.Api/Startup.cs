using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System.Text.Json.Serialization;
using VCCS.Api.Configurations.Setup;
using VCCS.Api.Filters;
using VCCS.Infra.CrossCuting.Helpers;

namespace VCCS.Api
{
    public class Startup
    {
        public IConfiguration Configuration { get; }
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public void ConfigureServices(IServiceCollection services)
        {
            var appSettings = GetAppSettings();
            var defaultScheme = JwtBearerDefaults.AuthenticationScheme;

            // AutoMapper Settings
            services.AddAutoMapper(typeof(Startup));

            // Authorization
            services.AddAuthorizationService(appSettings, defaultScheme);

            // Swagger Config
            services.AddSwaggerSetup();

            // MediatR
            services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Startup).Assembly));

            // .NET Native DI Abstraction
            services.AddDependencyInjectionSetup(appSettings);

            // Automapper config
            services.AddAutoMapperSetup();

            // SignalR
            services.AddSignalR();

            // Signal - Add VCCS Hub
            services.AddVCCSHub();

            services
                .AddMvc(options =>
                {
                    options.EnableEndpointRouting = false;
                    options.Filters.Add(new AuthorizeFilter(defaultScheme));
                    options.Filters.Add(typeof(CustomExceptionFilter));
                    options.Filters.Add(typeof(ClientValidationFilter));
                });

            services.AddHttpClient();

            services.AddControllers().AddJsonOptions(x =>
            {
                //x.JsonSerializerOptions.MaxDepth = 2;
                x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
            });

        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseSwaggerSetup();
            }

            app.UseHsts();

            // global cors policy
            app.UseCors(builder => builder
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowAnyOrigin()
            );

            app.UseRouting();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller=Home}/{action=Index}/{id?}");
            });

            // SignalR
            app.UseVCCSHub();

            app.UseMvc();
        }

        private AppSettings GetAppSettings()
        {
            return Configuration.GetSection("AppSettings").Get<AppSettings>();
        }
    }
}
