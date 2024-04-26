using DinkToPdf;
using DinkToPdf.Contracts;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using VCCS.Application.Notifications;
using VCCS.Domain.UoW;
using VCCS.Infra.Data.Context;
using VCCS.Infra.Data.UoW;
using VCCS.Infra.CrossCuting.Helpers;

namespace VCCS.Infra.CrossCuting.IoC
{
    public class NativeInjector
    {
        public static void RegisterServices(IServiceCollection services, AppSettings appSettings)
        {
            // Infra - Data - Context
            services.AddScoped<IDBContextOpr>(_ => new DBContext(appSettings.ConnectionStringOpr));
            services.AddDbContext<EFDbContextOpr>(options =>
            {
                options.UseLazyLoadingProxies(false)
                       .UseSqlServer(appSettings.ConnectionStringOpr)
                       .EnableSensitiveDataLogging(false);
            });

            // Notifications
            services.AddScoped<INotificationHandler<AppNotification>, AppNotificationHandler>();

            // Infra - Data - Repositories

            // Application - Services

            // Domain Helpers - Infra Helpers

            // Infra - Data - UoW
            services.AddTransient<IUnitOfWorkOpr>(_ => new UnitOfWork(_.GetService<IDBContextOpr>()));
            services.AddScoped<IEFUnitOfWorkOpr>(_ => new EFUnitOfWork(_.GetService<EFDbContextOpr>()));

            // Others
            services.AddHttpContextAccessor();
            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();

            // Jobs
            services.AddSingleton(typeof(IConverter), new SynchronizedConverter(new PdfTools()));
        }
    }
}
