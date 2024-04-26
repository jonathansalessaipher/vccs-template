using Microsoft.Extensions.DependencyInjection;
using System;
using VCCS.Infra.CrossCuting.IoC;
using VCCS.Infra.CrossCuting.Helpers;

namespace VCCS.Api.Configurations.Setup
{
    public static class DependencyInjectionSetup
    {
        public static void AddDependencyInjectionSetup(this IServiceCollection services, AppSettings appSettings)
        {
            if (services == null) throw new ArgumentNullException(nameof(services));

            NativeInjector.RegisterServices(services, appSettings);
        }
    }
}
