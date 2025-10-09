using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailPointBackend.Models;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/discount-reports")]
    public class DiscountReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DiscountReportsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/discountreports/summary?startDate=2023-01-01&endDate=2023-12-31
        [HttpGet("summary")]
        public async Task<ActionResult<DiscountSummaryReport>> GetDiscountSummary(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var start = startDate ?? DateTime.Today.AddDays(-30);
            var end = endDate ?? DateTime.Today.AddDays(1);

            var query = _context.OrderDiscounts
                .Include(od => od.Discount)
                .Include(od => od.Order)
                .Where(od => od.AppliedAt >= start && od.AppliedAt < end);

            var discounts = await query.ToListAsync();

            var summary = new DiscountSummaryReport
            {
                TotalDiscountAmount = discounts.Sum(d => d.DiscountAmount),
                TotalDiscountApplications = discounts.Count,
                UniqueOrdersWithDiscount = discounts.Select(d => d.OrderId).Distinct().Count(),
                AverageDiscountPerOrder = discounts.Any() ? 
                    (discounts.GroupBy(d => d.OrderId).Any() ? 
                        discounts.GroupBy(d => d.OrderId).Average(g => g.Sum(d => d.DiscountAmount)) : 0) : 0,
                
                DiscountsByType = discounts.GroupBy(d => d.DiscountType)
                    .Select(g => new DiscountTypeReport
                    {
                        Type = g.Key,
                        TypeName = GetDiscountTypeName(g.Key),
                        Count = g.Count(),
                        TotalAmount = g.Sum(d => d.DiscountAmount),
                        AverageAmount = g.Any() ? g.Average(d => d.DiscountAmount) : 0
                    }).ToList(),

                TopDiscounts = discounts.GroupBy(d => new { d.DiscountId, d.DiscountName })
                    .Select(g => new TopDiscountReport
                    {
                        DiscountId = g.Key.DiscountId,
                        DiscountName = g.Key.DiscountName,
                        UsageCount = g.Count(),
                        TotalAmount = g.Sum(d => d.DiscountAmount),
                        AverageAmount = g.Any() ? g.Average(d => d.DiscountAmount) : 0
                    })
                    .OrderByDescending(t => t.TotalAmount)
                    .Take(10)
                    .ToList(),

                DailyDiscounts = discounts.GroupBy(d => d.AppliedAt.Date)
                    .Select(g => new DailyDiscountReport
                    {
                        Date = g.Key,
                        Count = g.Count(),
                        TotalAmount = g.Sum(d => d.DiscountAmount),
                        UniqueOrders = g.Select(d => d.OrderId).Distinct().Count()
                    })
                    .OrderBy(d => d.Date)
                    .ToList()
            };

            return Ok(summary);
        }

        private string GetDiscountTypeName(DiscountType type)
        {
            return type switch
            {
                DiscountType.PercentageTotal => "Giảm % tổng bill",
                DiscountType.FixedAmountItem => "Giảm tiền mặt hàng",
                DiscountType.FixedAmountTotal => "Giảm tiền tổng bill",
                _ => "Không xác định"
            };
        }
    }

    // DTOs for Discount Reports
    public class DiscountSummaryReport
    {
        public decimal TotalDiscountAmount { get; set; }
        public int TotalDiscountApplications { get; set; }
        public int UniqueOrdersWithDiscount { get; set; }
        public decimal AverageDiscountPerOrder { get; set; }
        public List<DiscountTypeReport> DiscountsByType { get; set; } = new();
        public List<TopDiscountReport> TopDiscounts { get; set; } = new();
        public List<DailyDiscountReport> DailyDiscounts { get; set; } = new();
    }

    public class DiscountTypeReport
    {
        public DiscountType Type { get; set; }
        public string TypeName { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal AverageAmount { get; set; }
    }

    public class TopDiscountReport
    {
        public int DiscountId { get; set; }
        public string DiscountName { get; set; } = string.Empty;
        public int UsageCount { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal AverageAmount { get; set; }
    }

    public class DailyDiscountReport
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
        public decimal TotalAmount { get; set; }
        public int UniqueOrders { get; set; }
    }
}