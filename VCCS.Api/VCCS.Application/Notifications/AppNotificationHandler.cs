using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace VCCS.Application.Notifications
{
    public class AppNotificationHandler : INotificationHandler<AppNotification>
    {
        private List<AppNotification> _notifications;

        public AppNotificationHandler()
        {
            _notifications = new List<AppNotification>();
        }

        public Task Handle(AppNotification message, CancellationToken cancellationToken)
        {
            _notifications.Add(message);

            return Task.CompletedTask;
        }

        public virtual List<AppNotification> GetNotifications()
        {
            return _notifications;
        }

        public virtual bool HasNotifications()
        {
            return GetNotifications().Any();
        }

        public void Dispose()
        {
            _notifications = new List<AppNotification>();
        }
    }
}
