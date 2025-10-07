using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailPointBackend.Models;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly RetailPointContext _context;

        public DashboardController(RetailPointContext context)
        {
            _context = context;
        }

        [HttpGet("metrics")]
        public IActionResult GetDashboardMetrics()
        {
            try
            {
                var today = DateTime.Today;
                var yesterday = today.AddDays(-1);
                var thisMonth = new DateTime(today.Year, today.Month, 1);
                var lastMonth = thisMonth.AddMonths(-1);

                // Tính toán doanh thu hôm nay
                var todayOrders = _context.Orders
                    .Where(o => o.CreatedAt.Date == today && o.PaymentStatus == "paid" && o.Status != "cancelled")
                    .ToList();
                var todayRevenue = todayOrders.Sum(o => o.TotalAmount);

                // Tính toán doanh thu hôm qua để so sánh
                var yesterdayOrders = _context.Orders
                    .Where(o => o.CreatedAt.Date == yesterday && o.PaymentStatus == "paid" && o.Status != "cancelled")
                    .ToList();
                var yesterdayRevenue = yesterdayOrders.Sum(o => o.TotalAmount);

                // Tính % tăng trưởng doanh thu
                var revenueGrowth = yesterdayRevenue > 0 
                    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).ToString("F1") + "%"
                    : "N/A";

                // Tính tổng số đơn hàng (all time)
                var totalOrders = _context.Orders.Count();

                // Tính số đơn hàng hôm nay vs hôm qua
                var todayOrdersCount = todayOrders.Count;
                var yesterdayOrdersCount = yesterdayOrders.Count;
                var ordersGrowth = yesterdayOrdersCount > 0
                    ? ((double)(todayOrdersCount - yesterdayOrdersCount) / yesterdayOrdersCount * 100).ToString("F1") + "%"
                    : "N/A";

                // Tính số khách hàng mới hôm nay (giả sử customers có CreatedAt field)
                var newCustomersToday = _context.Customers.Count(); // Simplified for now

                // Tính số sản phẩm sắp hết hàng
                var lowStockItems = _context.Products
                    .Where(p => p.StockQuantity <= p.MinStockLevel)
                    .Count();

                // Tính doanh thu tháng này
                var thisMonthOrders = _context.Orders
                    .Where(o => o.CreatedAt >= thisMonth && o.PaymentStatus == "paid" && o.Status != "cancelled")
                    .ToList();
                var thisMonthRevenue = thisMonthOrders.Sum(o => o.TotalAmount);

                // Tính doanh thu tháng trước
                var lastMonthOrders = _context.Orders
                    .Where(o => o.CreatedAt >= lastMonth && o.CreatedAt < thisMonth && o.PaymentStatus == "paid" && o.Status != "cancelled")
                    .ToList();
                var lastMonthRevenue = lastMonthOrders.Sum(o => o.TotalAmount);

                var monthGrowth = lastMonthRevenue > 0
                    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).ToString("F1") + "%"
                    : "N/A";

                var response = new
                {
                    todayRevenue = todayRevenue.ToString("N0") + "₫",
                    todayGrowth = revenueGrowth.StartsWith("-") ? revenueGrowth : "+" + revenueGrowth,
                    monthRevenue = thisMonthRevenue.ToString("N0") + "₫", 
                    monthGrowth = monthGrowth.StartsWith("-") ? monthGrowth : "+" + monthGrowth,
                    ordersCount = totalOrders,
                    ordersGrowth = ordersGrowth.StartsWith("-") ? ordersGrowth : "+" + ordersGrowth,
                    newCustomers = newCustomersToday,
                    customersGrowth = "+0%", // Simplified
                    lowStockItems = lowStockItems,
                    // Thêm thống kê chi tiết về trạng thái đơn hàng
                    ordersByStatus = new
                    {
                        total = totalOrders,
                        paid = _context.Orders.Count(o => o.PaymentStatus == "paid"),
                        pending = _context.Orders.Count(o => o.PaymentStatus == "pending"),
                        failed = _context.Orders.Count(o => o.PaymentStatus == "failed"),
                        completed = _context.Orders.Count(o => o.Status == "completed"),
                        processing = _context.Orders.Count(o => o.Status == "pending"),
                        cancelled = _context.Orders.Count(o => o.Status == "cancelled")
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tải thống kê dashboard", error = ex.Message });
            }
        }

        [HttpGet("recent-orders")]
        public IActionResult GetRecentOrders()
        {
            try
            {
                var recentOrders = _context.Orders
                    .Include(o => o.Customer)
                    .OrderByDescending(o => o.CreatedAt)
                    .Take(5)
                    .ToList() // Đưa về memory trước để tránh lỗi expression tree
                    .Select(o => new
                    {
                        id = o.OrderId,
                        orderNumber = "#" + o.OrderId,
                        customer = o.CustomerName ?? o.Customer?.HoTen ?? "Khách lẻ",
                        total = o.TotalAmount.ToString("N0") + "₫",
                        status = o.PaymentStatus == "paid" && o.Status == "completed" ? "Hoàn thành"
                               : o.PaymentStatus == "pending" ? "Chờ thanh toán"
                               : o.Status == "pending" ? "Đang xử lý"
                               : "Khác",
                        time = GetTimeAgo(o.CreatedAt)
                    })
                    .ToList();

                return Ok(recentOrders);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tải đơn hàng gần đây", error = ex.Message });
            }
        }

        private string GetTimeAgo(DateTime createdAt)
        {
            var timeSpan = DateTime.Now - createdAt;
            
            if (timeSpan.TotalMinutes < 1)
                return "Vừa xong";
            if (timeSpan.TotalMinutes < 60)
                return $"{(int)timeSpan.TotalMinutes} phút trước";
            if (timeSpan.TotalHours < 24)
                return $"{(int)timeSpan.TotalHours} giờ trước";
            if (timeSpan.TotalDays < 30)
                return $"{(int)timeSpan.TotalDays} ngày trước";
            
            return createdAt.ToString("dd/MM/yyyy");
        }
    }
}