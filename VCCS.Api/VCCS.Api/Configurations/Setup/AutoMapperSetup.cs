using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using System;
using VCCS.Application.AutoMappers;

namespace VCCS.Api.Configurations.Setup
{
    public static class AutoMapperSetup
    {
        public static void AddAutoMapperSetup(this IServiceCollection service)
        {
            if (service == null)
                throw new ArgumentNullException(nameof(service));

            IMapper mapper = AutoMapperConfig.RegisterMappings().CreateMapper();
            service.AddSingleton(mapper);
        }
    }
}
