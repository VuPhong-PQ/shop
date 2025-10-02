using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailPointBackend.Models;
using System.Globalization;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("sales-summary")]
        public async Task<IActionResult> GetSalesSummary([FromQuery] string startDate, [FromQuery] string endDate)
        {
            try
            {
                var start = DateTime.Parse(startDate);
                var end = DateTime.Parse(endDate).AddDays(1); // Include end date

                // Lấy đơn hàng trong khoảng thời gian đã thanh toán
                var orders = await _context.Orders
                    .Where(o => o.CreatedAt >= start && o.CreatedAt < end && 
                           (o.PaymentStatus == "paid" || o.PaymentStatus == "completed"))
                    .Include(o => o.Items)
                    .ToListAsync();

                // Tính tổng doanh thu
                var totalRevenue = orders.Sum(o => o.TotalAmount);

                // Tổng số đơn hàng
                var totalOrders = orders.Count;

                // Tổng số khách hàng unique
                var totalCustomers = await _context.Customers.CountAsync();

                // Tính tổng số sản phẩm bán ra từ OrderItems
                var totalProductsSold = await _context.OrderItems
                    .Where(oi => oi.Order != null && oi.Order.CreatedAt >= start && oi.Order.CreatedAt < end && 
                                (oi.Order.PaymentStatus == "paid" || oi.Order.PaymentStatus == "completed"))
                    .SumAsync(oi => oi.Quantity);

                var response = new
                {
                    totalRevenue = totalRevenue.ToString("N0") + "₫",
                    totalOrders = totalOrders,
                    totalCustomers = totalCustomers,
                    totalProductsSold = totalProductsSold
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tải báo cáo tổng quan", error = ex.Message });
            }
        }

        [HttpGet("product-performance")]
        public async Task<IActionResult> GetProductPerformance([FromQuery] string startDate, [FromQuery] string endDate)
        {
            try
            {
                var start = DateTime.Parse(startDate);
                var end = DateTime.Parse(endDate).AddDays(1);

                // Lấy các sản phẩm bán chạy từ OrderItems với thông tin cost
                var orderItems = await _context.OrderItems
                    .Where(oi => oi.Order != null && oi.Order.CreatedAt >= start && oi.Order.CreatedAt < end && 
                                (oi.Order.PaymentStatus == "paid" || oi.Order.PaymentStatus == "completed"))
                    .Include(oi => oi.Order)
                    .ToListAsync();

                var products = await _context.Products.ToListAsync();
                
                var productStats = orderItems
                    .GroupBy(oi => new { oi.ProductId, oi.ProductName })
                    .Select(g => {
                        var product = products.FirstOrDefault(p => p.ProductId == g.Key.ProductId);
                        var costPrice = product?.CostPrice ?? (g.First().Price * 0.6m); // Fallback to 60% if no cost
                        
                        return new
                        {
                            productId = g.Key.ProductId,
                            name = g.Key.ProductName ?? "Sản phẩm #" + g.Key.ProductId,
                            totalSold = g.Sum(oi => oi.Quantity),
                            revenue = g.Sum(oi => oi.TotalPrice),
                            // Tính lợi nhuận đúng: (Giá bán - Giá nhập) × Số lượng
                            profit = g.Sum(oi => oi.Quantity * (oi.Price - costPrice))
                        };
                    })
                    .OrderByDescending(p => p.totalSold)
                    .Take(10)
                    .ToList();

                var topProducts = productStats.Select(p => new
                {
                    name = p.name,
                    totalSold = p.totalSold,
                    revenue = p.revenue.ToString("N0") + "₫",
                    profit = p.profit.ToString("N0") + "₫"
                }).ToList();

                // Tính tổng sản phẩm bán ra
                var totalProductsSold = await _context.OrderItems
                    .Where(oi => oi.Order != null && oi.Order.CreatedAt >= start && oi.Order.CreatedAt < end && 
                                (oi.Order.PaymentStatus == "paid" || oi.Order.PaymentStatus == "completed"))
                    .SumAsync(oi => oi.Quantity);

                // Sản phẩm phổ biến nhất
                var mostPopularProduct = topProducts.FirstOrDefault()?.name ?? "N/A";

                var response = new
                {
                    topProducts = topProducts,
                    totalProductsSold = totalProductsSold,
                    mostPopularProduct = mostPopularProduct
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tải báo cáo sản phẩm", error = ex.Message });
            }
        }

        [HttpGet("customer-analytics")]
        public async Task<IActionResult> GetCustomerAnalytics([FromQuery] string startDate, [FromQuery] string endDate)
        {
            try
            {
                var start = DateTime.Parse(startDate);
                var end = DateTime.Parse(endDate).AddDays(1);

                // Tổng số khách hàng
                var totalCustomers = await _context.Customers.CountAsync();

                // Khách hàng mới trong kỳ (nếu có trường CreatedAt)
                var newCustomers = 0; // Tạm thời = 0 vì Customer model chưa có CreatedAt

                // Khách hàng có đơn hàng trong kỳ
                var activeCustomers = await _context.Orders
                    .Where(o => o.CreatedAt >= start && o.CreatedAt < end && 
                               (o.PaymentStatus == "paid" || o.PaymentStatus == "completed"))
                    .Select(o => o.CustomerId)
                    .Distinct()
                    .CountAsync();

                // Khách hàng quay lại (có > 1 đơn hàng)
                var returningCustomers = await _context.Orders
                    .Where(o => (o.PaymentStatus == "paid" || o.PaymentStatus == "completed") && o.CustomerId.HasValue)
                    .GroupBy(o => o.CustomerId)
                    .Where(g => g.Count() > 1)
                    .CountAsync();

                // Top khách hàng VIP
                var topCustomers = await _context.Orders
                    .Where(o => o.CreatedAt >= start && o.CreatedAt < end && 
                               (o.PaymentStatus == "paid" || o.PaymentStatus == "completed") && o.CustomerId.HasValue)
                    .Include(o => o.Customer)
                    .GroupBy(o => new { o.CustomerId, o.Customer.HoTen })
                    .Select(g => new
                    {
                        customerId = g.Key.CustomerId,
                        name = g.Key.HoTen ?? "Khách hàng #" + g.Key.CustomerId,
                        orders = g.Count(),
                        totalSpent = g.Sum(o => o.TotalAmount)
                    })
                    .OrderByDescending(c => c.totalSpent)
                    .Take(5)
                    .ToListAsync();

                // Trung bình đơn hàng trên khách
                var averageOrdersPerCustomer = activeCustomers > 0 
                    ? Math.Round((double)await _context.Orders
                        .Where(o => o.CreatedAt >= start && o.CreatedAt < end && 
                                   (o.PaymentStatus == "paid" || o.PaymentStatus == "completed"))
                        .CountAsync() / activeCustomers, 1)
                    : 0;

                var formattedTopCustomers = topCustomers.Select(c => new
                {
                    name = c.name,
                    orders = c.orders,
                    totalSpent = c.totalSpent.ToString("N0") + "₫"
                }).ToList();

                var response = new
                {
                    totalCustomers = totalCustomers,
                    newCustomers = newCustomers,
                    returningCustomers = returningCustomers,
                    averageOrdersPerCustomer = averageOrdersPerCustomer.ToString("F1"),
                    topCustomers = formattedTopCustomers
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tải phân tích khách hàng", error = ex.Message });
            }
        }

        [HttpGet("profit-analysis")]
        public async Task<IActionResult> GetProfitAnalysis([FromQuery] string startDate, [FromQuery] string endDate)
        {
            try
            {
                var start = DateTime.Parse(startDate);
                var end = DateTime.Parse(endDate).AddDays(1);

                // Lấy đơn hàng trong kỳ
                var orders = await _context.Orders
                    .Where(o => o.CreatedAt >= start && o.CreatedAt < end && 
                               (o.PaymentStatus == "paid" || o.PaymentStatus == "completed"))
                    .ToListAsync();

                // Tính tổng doanh thu
                var totalRevenue = orders.Sum(o => o.TotalAmount);

                // Giả sử cost of goods sold = 60% revenue
                var costOfGoodsSold = totalRevenue * 0.6m;

                // Lợi nhuận gộp
                var grossProfit = totalRevenue - costOfGoodsSold;

                // Giả sử chi phí hoạt động = 20% revenue
                var operatingExpenses = totalRevenue * 0.2m;

                // Lợi nhuận ròng
                var netProfit = grossProfit - operatingExpenses;

                // Tỷ suất lợi nhuận
                var profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;

                // Top sản phẩm có lợi nhuận cao từ OrderItems
                var profitableProducts = await _context.OrderItems
                    .Where(oi => oi.Order != null && oi.Order.CreatedAt >= start && oi.Order.CreatedAt < end && 
                                (oi.Order.PaymentStatus == "paid" || oi.Order.PaymentStatus == "completed"))
                    .GroupBy(oi => oi.ProductName)
                    .Select(g => new
                    {
                        name = g.Key ?? "Sản phẩm không tên",
                        profit = g.Sum(oi => oi.TotalPrice * 0.4m) // 40% profit margin
                    })
                    .OrderByDescending(p => p.profit)
                    .Take(5)
                    .Select(p => new
                    {
                        name = p.name,
                        profit = p.profit.ToString("N0") + "₫",
                        margin = "40%"
                    })
                    .ToListAsync();

                // Xu hướng lợi nhuận theo tháng (6 tháng gần nhất)
                var monthlyTrend = new List<object>();
                for (int i = 5; i >= 0; i--)
                {
                    var monthStart = DateTime.Now.AddMonths(-i).Date.AddDays(1 - DateTime.Now.AddMonths(-i).Day);
                    var monthEnd = monthStart.AddMonths(1);
                    
                    var monthOrders = await _context.Orders
                        .Where(o => o.CreatedAt >= monthStart && o.CreatedAt < monthEnd && 
                                   (o.PaymentStatus == "paid" || o.PaymentStatus == "completed"))
                        .SumAsync(o => o.TotalAmount);

                    var monthProfit = monthOrders * 0.2m; // 20% profit margin
                    
                    monthlyTrend.Add(new
                    {
                        month = monthStart.ToString("MM/yyyy"),
                        profit = monthProfit.ToString("N0") + "₫",
                        margin = "20%"
                    });
                }

                var response = new
                {
                    grossProfit = grossProfit.ToString("N0") + "₫",
                    costOfGoodsSold = costOfGoodsSold.ToString("N0") + "₫",
                    operatingExpenses = operatingExpenses.ToString("N0") + "₫",
                    totalProfit = netProfit.ToString("N0") + "₫",
                    profitMargin = profitMargin.ToString("F1") + "%",
                    profitableProducts = profitableProducts,
                    monthlyTrend = monthlyTrend
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tải phân tích lợi nhuận", error = ex.Message });
            }
        }
    }
}