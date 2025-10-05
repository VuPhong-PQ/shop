using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailPointBackend.Models;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InventoryController : ControllerBase
    {
        private readonly AppDbContext _context;

        public InventoryController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Inventory/transactions
        [HttpGet("transactions")]
        public async Task<ActionResult<IEnumerable<InventoryTransactionResponseDto>>> GetTransactions(
            [FromQuery] int? productId = null,
            [FromQuery] TransactionType? type = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                Console.WriteLine($"Getting inventory transactions - ProductId: {productId}, Type: {type}, Page: {page}");

                var query = _context.InventoryTransactions
                    .Include(t => t.Product)
                    .Include(t => t.Staff)
                    .Include(t => t.Order)
                    .AsQueryable();

                // Apply filters
                if (productId.HasValue)
                    query = query.Where(t => t.ProductId == productId.Value);

                if (type.HasValue)
                    query = query.Where(t => t.Type == type.Value);

                if (fromDate.HasValue)
                    query = query.Where(t => t.TransactionDate >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(t => t.TransactionDate <= toDate.Value);

                // Apply pagination
                var totalCount = await query.CountAsync();
                var transactions = await query
                    .OrderByDescending(t => t.TransactionDate)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(t => new InventoryTransactionResponseDto
                    {
                        TransactionId = t.TransactionId,
                        ProductId = t.ProductId,
                        ProductName = t.Product.Name ?? "",
                        ProductCode = t.Product.Barcode ?? "",
                        StaffId = t.StaffId,
                        StaffName = t.Staff.FullName,
                        Type = t.Type,
                        TypeName = t.Type == TransactionType.IN ? "Nhập kho" : "Xuất kho",
                        Quantity = t.Quantity,
                        UnitPrice = t.UnitPrice,
                        TotalValue = t.TotalValue,
                        Reason = t.Reason,
                        Notes = t.Notes,
                        OrderId = t.OrderId,
                        SupplierId = t.SupplierId,
                        SupplierName = t.SupplierName,
                        ReferenceNumber = t.ReferenceNumber,
                        TransactionDate = t.TransactionDate,
                        CreatedAt = t.CreatedAt,
                        StockBefore = t.StockBefore,
                        StockAfter = t.StockAfter
                    })
                    .ToListAsync();

                Console.WriteLine($"Found {transactions.Count} transactions out of {totalCount} total");

                return Ok(new
                {
                    data = transactions,
                    totalCount,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting inventory transactions: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khi lấy lịch sử xuất nhập kho", error = ex.Message });
            }
        }

        // GET: api/Inventory/summary
        [HttpGet("summary")]
        public async Task<ActionResult<IEnumerable<InventorySummaryDto>>> GetInventorySummary()
        {
            try
            {
                Console.WriteLine("Getting inventory summary...");

                var summary = await _context.Products
                    .Select(p => new InventorySummaryDto
                    {
                        ProductId = p.ProductId,
                        ProductName = p.Name ?? "",
                        ProductCode = p.Barcode ?? "",
                        CurrentStock = p.StockQuantity,
                        TotalInbound = _context.InventoryTransactions
                            .Where(t => t.ProductId == p.ProductId && t.Type == TransactionType.IN)
                            .Sum(t => (int?)t.Quantity) ?? 0,
                        TotalOutbound = _context.InventoryTransactions
                            .Where(t => t.ProductId == p.ProductId && t.Type == TransactionType.OUT)
                            .Sum(t => (int?)Math.Abs(t.Quantity)) ?? 0,
                        TotalInboundValue = _context.InventoryTransactions
                            .Where(t => t.ProductId == p.ProductId && t.Type == TransactionType.IN)
                            .Sum(t => (decimal?)t.TotalValue) ?? 0,
                        TotalOutboundValue = _context.InventoryTransactions
                            .Where(t => t.ProductId == p.ProductId && t.Type == TransactionType.OUT)
                            .Sum(t => (decimal?)Math.Abs(t.TotalValue)) ?? 0,
                        LastTransaction = _context.InventoryTransactions
                            .Where(t => t.ProductId == p.ProductId)
                            .OrderByDescending(t => t.TransactionDate)
                            .Select(t => (DateTime?)t.TransactionDate)
                            .FirstOrDefault()
                    })
                    .ToListAsync();

                Console.WriteLine($"Generated summary for {summary.Count} products");
                return Ok(summary);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting inventory summary: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khi lấy tổng hợp kho", error = ex.Message });
            }
        }

        // POST: api/Inventory/inbound
        [HttpPost("inbound")]
        public async Task<ActionResult<InventoryTransactionResponseDto>> CreateInboundTransaction([FromBody] CreateInboundTransactionDto dto)
        {
            try
            {
                Console.WriteLine($"Creating inbound transaction for Product {dto.ProductId}, Quantity: {dto.Quantity}");

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Verify product exists
                var product = await _context.Products.FindAsync(dto.ProductId);
                if (product == null)
                {
                    return NotFound(new { message = "Sản phẩm không tồn tại" });
                }

                // Get current user (for now, use a default staff ID - you should get this from authentication)
                var staffId = 1; // TODO: Get from authentication context

                var stockBefore = product.StockQuantity;
                var stockAfter = stockBefore + dto.Quantity;

                var transaction = new InventoryTransaction
                {
                    ProductId = dto.ProductId,
                    StaffId = staffId,
                    Type = TransactionType.IN,
                    Quantity = dto.Quantity,
                    UnitPrice = dto.UnitPrice,
                    TotalValue = dto.Quantity * dto.UnitPrice,
                    Reason = dto.Reason,
                    Notes = dto.Notes,
                    SupplierId = dto.SupplierId,
                    SupplierName = dto.SupplierName,
                    ReferenceNumber = dto.ReferenceNumber,
                    TransactionDate = dto.TransactionDate ?? DateTime.Now,
                    StockBefore = stockBefore,
                    StockAfter = stockAfter
                };

                // Update product stock
                product.StockQuantity = stockAfter;

                _context.InventoryTransactions.Add(transaction);
                await _context.SaveChangesAsync();

                Console.WriteLine($"Inbound transaction created with ID: {transaction.TransactionId}");

                // Return the created transaction
                var result = new InventoryTransactionResponseDto
                {
                    TransactionId = transaction.TransactionId,
                    ProductId = transaction.ProductId,
                    ProductName = product.Name ?? "",
                    ProductCode = product.Barcode ?? "",
                    StaffId = transaction.StaffId,
                    StaffName = "Admin", // TODO: Get from staff entity
                    Type = transaction.Type,
                    TypeName = "Nhập kho",
                    Quantity = transaction.Quantity,
                    UnitPrice = transaction.UnitPrice,
                    TotalValue = transaction.TotalValue,
                    Reason = transaction.Reason,
                    Notes = transaction.Notes,
                    SupplierId = transaction.SupplierId,
                    SupplierName = transaction.SupplierName,
                    ReferenceNumber = transaction.ReferenceNumber,
                    TransactionDate = transaction.TransactionDate,
                    CreatedAt = transaction.CreatedAt,
                    StockBefore = transaction.StockBefore,
                    StockAfter = transaction.StockAfter
                };

                return CreatedAtAction(nameof(GetTransactions), new { id = transaction.TransactionId }, result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating inbound transaction: {ex.Message}");
                return StatusCode(500, new { message = "Không thể tạo giao dịch nhập kho", error = ex.Message });
            }
        }

        // POST: api/Inventory/outbound
        [HttpPost("outbound")]
        public async Task<ActionResult<InventoryTransactionResponseDto>> CreateOutboundTransaction([FromBody] CreateOutboundTransactionDto dto)
        {
            try
            {
                Console.WriteLine($"Creating outbound transaction for Product {dto.ProductId}, Quantity: {dto.Quantity}");

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Verify product exists and has enough stock
                var product = await _context.Products.FindAsync(dto.ProductId);
                if (product == null)
                {
                    return NotFound(new { message = "Sản phẩm không tồn tại" });
                }

                if (product.StockQuantity < dto.Quantity)
                {
                    return BadRequest(new { message = $"Không đủ hàng tồn kho. Hiện có: {product.StockQuantity}, yêu cầu: {dto.Quantity}" });
                }

                // Get current user (for now, use a default staff ID)
                var staffId = 1; // TODO: Get from authentication context

                var stockBefore = product.StockQuantity;
                var stockAfter = stockBefore - dto.Quantity;

                var transaction = new InventoryTransaction
                {
                    ProductId = dto.ProductId,
                    StaffId = staffId,
                    Type = TransactionType.OUT,
                    Quantity = -dto.Quantity, // Negative for outbound
                    UnitPrice = product.Price, // Use current product price
                    TotalValue = -dto.Quantity * product.Price,
                    Reason = dto.Reason,
                    Notes = dto.Notes,
                    OrderId = dto.OrderId,
                    ReferenceNumber = dto.ReferenceNumber,
                    TransactionDate = dto.TransactionDate ?? DateTime.Now,
                    StockBefore = stockBefore,
                    StockAfter = stockAfter
                };

                // Update product stock
                product.StockQuantity = stockAfter;

                _context.InventoryTransactions.Add(transaction);
                await _context.SaveChangesAsync();

                Console.WriteLine($"Outbound transaction created with ID: {transaction.TransactionId}");

                // Return the created transaction
                var result = new InventoryTransactionResponseDto
                {
                    TransactionId = transaction.TransactionId,
                    ProductId = transaction.ProductId,
                    ProductName = product.Name ?? "",
                    ProductCode = product.Barcode ?? "",
                    StaffId = transaction.StaffId,
                    StaffName = "Admin", // TODO: Get from staff entity
                    Type = transaction.Type,
                    TypeName = "Xuất kho",
                    Quantity = transaction.Quantity,
                    UnitPrice = transaction.UnitPrice,
                    TotalValue = transaction.TotalValue,
                    Reason = transaction.Reason,
                    Notes = transaction.Notes,
                    OrderId = transaction.OrderId,
                    ReferenceNumber = transaction.ReferenceNumber,
                    TransactionDate = transaction.TransactionDate,
                    CreatedAt = transaction.CreatedAt,
                    StockBefore = transaction.StockBefore,
                    StockAfter = transaction.StockAfter
                };

                return CreatedAtAction(nameof(GetTransactions), new { id = transaction.TransactionId }, result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating outbound transaction: {ex.Message}");
                return StatusCode(500, new { message = "Không thể tạo giao dịch xuất kho", error = ex.Message });
            }
        }

        // GET: api/Inventory/transactions/{id}
        [HttpGet("transactions/{id}")]
        public async Task<ActionResult<InventoryTransactionResponseDto>> GetTransaction(int id)
        {
            try
            {
                var transaction = await _context.InventoryTransactions
                    .Include(t => t.Product)
                    .Include(t => t.Staff)
                    .Include(t => t.Order)
                    .Where(t => t.TransactionId == id)
                    .Select(t => new InventoryTransactionResponseDto
                    {
                        TransactionId = t.TransactionId,
                        ProductId = t.ProductId,
                        ProductName = t.Product.Name ?? "",
                        ProductCode = t.Product.Barcode ?? "",
                        StaffId = t.StaffId,
                        StaffName = t.Staff.FullName,
                        Type = t.Type,
                        TypeName = t.Type == TransactionType.IN ? "Nhập kho" : "Xuất kho",
                        Quantity = t.Quantity,
                        UnitPrice = t.UnitPrice,
                        TotalValue = t.TotalValue,
                        Reason = t.Reason,
                        Notes = t.Notes,
                        OrderId = t.OrderId,
                        SupplierId = t.SupplierId,
                        SupplierName = t.SupplierName,
                        ReferenceNumber = t.ReferenceNumber,
                        TransactionDate = t.TransactionDate,
                        CreatedAt = t.CreatedAt,
                        StockBefore = t.StockBefore,
                        StockAfter = t.StockAfter
                    })
                    .FirstOrDefaultAsync();

                if (transaction == null)
                {
                    return NotFound(new { message = "Giao dịch không tồn tại" });
                }

                return Ok(transaction);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting transaction {id}: {ex.Message}");
                return StatusCode(500, new { message = "Lỗi khi lấy thông tin giao dịch", error = ex.Message });
            }
        }
    }
}