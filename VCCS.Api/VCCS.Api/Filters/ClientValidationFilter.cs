using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;
using System.Linq;

namespace VCCS.Api.Filters
{
    public class ClientValidationFilter : IActionFilter
    {
        public const string ContextType = "application/json";
        private readonly List<string> _ignoreCases = new() { "/", "/get-version", "/swagger", "/swagger/index.html", "/vccsHub/negotiate" };

        private readonly ILogger<ClientValidationFilter> _logger;

        public ClientValidationFilter(
            ILogger<ClientValidationFilter> logger)
        {
            _logger = logger;
        }

        public void OnActionExecuted(ActionExecutedContext context)
        {
        }

        public void OnActionExecuting(ActionExecutingContext context)
        {
            if (!_ignoreCases.Contains(context.HttpContext.Request.Path))
            {
                var ip = context.HttpContext.Connection.RemoteIpAddress;

                _logger.LogWarning("Header client-id não está presenta na aplicação: '{0}'", ip);

                context.HttpContext.Response.StatusCode = 401;
                context.HttpContext.Response.ContentType = ContextType;

                if (context.HttpContext.Response.Headers.Any(x => x.Key == "x-result-msg"))
                {
                    context.HttpContext.Response.Headers.Remove("x-result-msg");
                }

                context.HttpContext.Response.Headers.Add("x-result-msg", $"Next invalid request the IP '{ip}' will be blocked in our servers.");

                context.Result = new ObjectResult(new { success = false, error = $"Next invalid request the IP '{ip}' will be blocked in our servers." });
            }
            }
    }
}
