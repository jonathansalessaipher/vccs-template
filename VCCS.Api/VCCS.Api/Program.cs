using Microsoft.AspNetCore.Builder;
using Serilog;
using System;
using VCCS.Api;
using VCCS.Api.Configurations.Setup;

try
{
    var builder = WebApplication.CreateBuilder(args);

    var startup = new Startup(builder.Configuration);
    startup.ConfigureServices(builder.Services);

    // Logging
    builder.Host.UseSerilog();
    SerilogSetup.AddSerilogSetup();

    var app = builder.Build();
    startup.Configure(app, app.Environment);

    Log.Information("**** INICIANDO API ****");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "**** API ENCERRADA ****");
}
finally
{
    Log.CloseAndFlush();
}