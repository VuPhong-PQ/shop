using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailPointBackend.Models;
using System.Text.Json;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/notifications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetNotifications(
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 20,
            [FromQuery] bool? unreadOnly = null)
        {
            var query = _context.Notifications.AsQueryable();

            if (unreadOnly == true)
            {
                query = query.Where(n => n.Status == NotificationStatus.Unread);
            }

            var notifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var result = notifications.Select(n => new
            {
                n.NotificationId,
                n.Type,
                n.Title,
                n.Message,
                n.Status,
                n.CreatedAt,
                n.ReadAt,
                n.OrderId,
                n.ProductId,
                n.CustomerId,
                Metadata = n.Metadata != null ? JsonSerializer.Deserialize<object>(n.Metadata) : null
            }).ToList();

            return Ok(result);
        }

        // GET: api/notifications/count
        [HttpGet("count")]
        public async Task<ActionResult<object>> GetNotificationCount()
        {
            var unreadCount = await _context.Notifications
                .CountAsync(n => n.Status == NotificationStatus.Unread);

            var totalCount = await _context.Notifications.CountAsync();

            return Ok(new { unreadCount, totalCount });
        }

        // POST: api/notifications/{id}/mark-read
        [HttpPost("{id}/mark-read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
            {
                return NotFound();
            }

            notification.Status = NotificationStatus.Read;
            notification.ReadAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/notifications/mark-all-read
        [HttpPost("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => n.Status == NotificationStatus.Unread)
                .ToListAsync();

            var now = DateTime.Now;
            foreach (var notification in unreadNotifications)
            {
                notification.Status = NotificationStatus.Read;
                notification.ReadAt = now;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/notifications/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
            {
                return NotFound();
            }

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Internal method to create notifications (used by other controllers)
        public static async Task<Notification> CreateNotificationAsync(
            AppDbContext context,
            NotificationType type,
            string title,
            string? message = null,
            int? orderId = null,
            int? productId = null,
            int? customerId = null,
            object? metadata = null)
        {
            var notification = new Notification
            {
                Type = type,
                Title = title,
                Message = message,
                OrderId = orderId,
                ProductId = productId,
                CustomerId = customerId,
                Metadata = metadata != null ? JsonSerializer.Serialize(metadata) : null
            };

            context.Notifications.Add(notification);
            await context.SaveChangesAsync();

            return notification;
        }
    }
}