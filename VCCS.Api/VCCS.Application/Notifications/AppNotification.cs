using MediatR;
using System.Net;

namespace VCCS.Application.Notifications
{
    public class AppNotification : INotification
    {
        public HttpStatusCode Code { get; private set; }
        public string Notification { get; private set; }

        public AppNotification(string notification, HttpStatusCode code = HttpStatusCode.BadRequest)
        {
            Code = code;
            Notification = notification;
        }
    }
}
