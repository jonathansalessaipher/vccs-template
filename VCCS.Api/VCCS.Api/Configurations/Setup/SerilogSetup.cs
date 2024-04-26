using Serilog;
using Serilog.Events;
using System;

namespace VCCS.Api.Configurations.Setup
{
    public static class SerilogSetup
    {
        public static void AddSerilogSetup()
        {
            string appName = typeof(Program).Assembly.GetName().Name;

            string pathLogRoot =
                string.IsNullOrEmpty(Environment.GetEnvironmentVariable("WEBSITE_SITE_NAME"))
                ? $"C:/inetpub/logs/Application/{appName}"
                : "../../LogFiles/Application";

            Log.Logger =
                new LoggerConfiguration()
                    .MinimumLevel.Debug()
                    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
                    .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
                    .Enrich.FromLogContext()
                    .WriteTo.Console()
                    .WriteTo.File($"{pathLogRoot}/api.log.txt", rollingInterval: RollingInterval.Hour)
                    .CreateLogger();
        }
    }
}
