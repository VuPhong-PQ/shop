using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailPointBackend.Models;
using OfficeOpenXml;
using OfficeOpenXml.Style;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ProductsController(AppDbContext context)
        {
            _context = context;
        }


        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromBody] Product product)
        {
            try
            {
                // Log thông tin nhận được
                Console.WriteLine($"[CreateProduct] Nhận product: {System.Text.Json.JsonSerializer.Serialize(product)}");
                _context.Products.Add(product);
                await _context.SaveChangesAsync();
                Console.WriteLine($"[CreateProduct] Đã lưu productId: {product.ProductId}");
                return CreatedAtAction(nameof(GetProduct), new { id = product.ProductId }, product);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CreateProduct][ERROR] {ex.Message}\n{ex.StackTrace}");
                return StatusCode(500, new { error = ex.Message, stack = ex.StackTrace });
            }
        }

        // GET: api/products
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
        {
            return await _context.Products.ToListAsync();
        }

        // GET: api/products/low-stock
        [HttpGet("low-stock")]
        public async Task<ActionResult> GetLowStockProducts()
        {
            var products = await _context.Products
                .Where(p => p.StockQuantity <= p.MinStockLevel)
                .OrderBy(p => p.StockQuantity)
                .ToListAsync();

            var lowStockProducts = products.Select(p => new {
                p.ProductId,
                p.Name,
                p.Barcode,
                p.StockQuantity,
                p.MinStockLevel,
                p.Price,
                p.Unit,
                p.StockDeficit,
                p.IsOutOfStock,
                p.StockStatus
            }).ToList();

            return Ok(new 
            { 
                Count = lowStockProducts.Count,
                Products = lowStockProducts 
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();
            return product;
        }
        // PUT: api/products/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] Product updatedProduct)
        {
            try
            {
                Console.WriteLine($"[UpdateProduct] Updating product ID: {id}");
                Console.WriteLine($"[UpdateProduct] Product data: {System.Text.Json.JsonSerializer.Serialize(updatedProduct)}");
                
                if (id != updatedProduct.ProductId)
                {
                    Console.WriteLine($"[UpdateProduct] ID mismatch: {id} != {updatedProduct.ProductId}");
                    return BadRequest(new { message = "ID không khớp" });
                }

                var existingProduct = await _context.Products.FindAsync(id);
                if (existingProduct == null)
                {
                    Console.WriteLine($"[UpdateProduct] Product not found: {id}");
                    return NotFound(new { message = "Sản phẩm không tồn tại" });
                }

                // Update properties
                existingProduct.Name = updatedProduct.Name;
                existingProduct.Barcode = updatedProduct.Barcode;
                existingProduct.CategoryId = updatedProduct.CategoryId;
                existingProduct.ProductGroupId = updatedProduct.ProductGroupId;
                existingProduct.Price = updatedProduct.Price;
                existingProduct.CostPrice = updatedProduct.CostPrice;
                existingProduct.StockQuantity = updatedProduct.StockQuantity;
                existingProduct.MinStockLevel = updatedProduct.MinStockLevel;
                existingProduct.Unit = updatedProduct.Unit;
                existingProduct.ImageUrl = updatedProduct.ImageUrl;
                existingProduct.Description = updatedProduct.Description;

                await _context.SaveChangesAsync();
                Console.WriteLine($"[UpdateProduct] Successfully updated product: {id}");
                
                return Ok(new { message = "Cập nhật sản phẩm thành công", product = existingProduct });
            }
            catch (DbUpdateConcurrencyException ex)
            {
                Console.WriteLine($"[UpdateProduct] Concurrency error: {ex.Message}");
                if (!_context.Products.Any(e => e.ProductId == id))
                {
                    return NotFound(new { message = "Sản phẩm không tồn tại" });
                }
                else
                {
                    return StatusCode(500, new { message = "Lỗi đồng thời", error = ex.Message });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[UpdateProduct] Error: {ex.Message}");
                Console.WriteLine($"[UpdateProduct] Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Không thể cập nhật sản phẩm", error = ex.Message });
            }
        }

        // DELETE: api/products/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }
            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/products/{id}/adjust-stock
        [HttpPost("{id}/adjust-stock")]
        public async Task<IActionResult> AdjustStock(int id, [FromBody] StockAdjustmentRequest request)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound("Sản phẩm không tồn tại");
            }

            var oldStock = product.StockQuantity;
            product.StockQuantity = request.NewQuantity;

            try
            {
                await _context.SaveChangesAsync();
                
                var result = new
                {
                    ProductId = product.ProductId,
                    ProductName = product.Name,
                    OldStock = oldStock,
                    NewStock = product.StockQuantity,
                    MinStockLevel = product.MinStockLevel,
                    IsLowStock = product.IsLowStock,
                    IsOutOfStock = product.IsOutOfStock,
                    StockStatus = product.StockStatus,
                    StockDeficit = product.StockDeficit,
                    Reason = request.Reason ?? "Điều chỉnh tồn kho"
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi cập nhật tồn kho", error = ex.Message });
            }
        }

        // GET: api/products/{id}/stock-info
        [HttpGet("{id}/stock-info")]
        public async Task<ActionResult> GetProductStockInfo(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound("Sản phẩm không tồn tại");
            }

            var stockInfo = new
            {
                product.ProductId,
                product.Name,
                product.StockQuantity,
                product.MinStockLevel,
                product.IsLowStock,
                product.IsOutOfStock,
                product.StockDeficit,
                product.StockStatus
            };

            return Ok(stockInfo);
        }

        // GET: api/products/export-template
        [HttpGet("export-template")]
        public async Task<IActionResult> ExportTemplate()
        {
            try
            {
                // Set license cho EPPlus 5.x
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
                
                using var package = new ExcelPackage();
                var worksheet = package.Workbook.Worksheets.Add("Products Template");

                // Thiết lập headers
                var headers = new[] { 
                    "Tên sản phẩm (*)", 
                    "Mã vạch", 
                    "Giá bán (*)", 
                    "Giá vốn", 
                    "Số lượng tồn kho (*)", 
                    "Mức tồn kho tối thiểu", 
                    "Đơn vị", 
                    "Mô tả",
                    "ID Nhóm sản phẩm (*)"
                };

                // Thêm headers vào hàng đầu tiên
                for (int i = 0; i < headers.Length; i++)
                {
                    worksheet.Cells[1, i + 1].Value = headers[i];
                    worksheet.Cells[1, i + 1].Style.Font.Bold = true;
                    worksheet.Cells[1, i + 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                    worksheet.Cells[1, i + 1].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightBlue);
                }

                // Lấy dữ liệu thực tế từ database
                var products = await _context.Products.Take(5).ToListAsync(); // Lấy 5 sản phẩm mẫu
                var productGroups = await _context.ProductGroups.ToListAsync();

                // Thêm dữ liệu sản phẩm thực tế làm ví dụ
                int row = 2;
                foreach (var product in products)
                {
                    worksheet.Cells[row, 1].Value = product.Name ?? "Tên sản phẩm";
                    worksheet.Cells[row, 2].Value = product.Barcode ?? "";
                    worksheet.Cells[row, 3].Value = (double)product.Price;
                    worksheet.Cells[row, 4].Value = product.CostPrice.HasValue ? (double)product.CostPrice.Value : 0;
                    worksheet.Cells[row, 5].Value = product.StockQuantity;
                    worksheet.Cells[row, 6].Value = product.MinStockLevel;
                    worksheet.Cells[row, 7].Value = product.Unit ?? "chiếc";
                    worksheet.Cells[row, 8].Value = product.Description ?? "";
                    worksheet.Cells[row, 9].Value = product.ProductGroupId ?? 1;
                    row++;
                }

                // Auto-fit columns
                worksheet.Cells.AutoFitColumns();

                // Tạo sheet thứ 2 cho danh sách nhóm sản phẩm
                var groupSheet = package.Workbook.Worksheets.Add("Danh sách nhóm sản phẩm");
                groupSheet.Cells[1, 1].Value = "ID Nhóm";
                groupSheet.Cells[1, 2].Value = "Tên nhóm";
                groupSheet.Cells[1, 1].Style.Font.Bold = true;
                groupSheet.Cells[1, 2].Style.Font.Bold = true;
                groupSheet.Cells[1, 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                groupSheet.Cells[1, 1].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGreen);
                groupSheet.Cells[1, 2].Style.Fill.PatternType = ExcelFillStyle.Solid;
                groupSheet.Cells[1, 2].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGreen);

                // Thêm danh sách nhóm sản phẩm
                int groupRow = 2;
                foreach (var group in productGroups)
                {
                    groupSheet.Cells[groupRow, 1].Value = group.ProductGroupId;
                    groupSheet.Cells[groupRow, 2].Value = group.Name;
                    groupRow++;
                }
                groupSheet.Cells.AutoFitColumns();

                // Quay lại sheet đầu tiên và thêm ghi chú hướng dẫn
                worksheet.Select();
                int instructionRow = row + 1;
                worksheet.Cells[instructionRow, 1].Value = "HƯỚNG DẪN:";
                worksheet.Cells[instructionRow, 1].Style.Font.Bold = true;
                instructionRow++;
                worksheet.Cells[instructionRow, 1].Value = "- Các cột có dấu (*) là bắt buộc";
                instructionRow++;
                worksheet.Cells[instructionRow, 1].Value = "- Giá bán và Giá vốn nhập bằng số (VNĐ)";
                instructionRow++;
                worksheet.Cells[instructionRow, 1].Value = "- Số lượng tồn kho và Mức tồn kho tối thiểu nhập bằng số nguyên";
                instructionRow++;
                worksheet.Cells[instructionRow, 1].Value = "- ID Nhóm sản phẩm: xem sheet 'Danh sách nhóm sản phẩm'";
                instructionRow++;
                worksheet.Cells[instructionRow, 1].Value = "- Các dòng dữ liệu mẫu phía trên có thể sửa đổi hoặc xóa";
                instructionRow++;
                worksheet.Cells[instructionRow, 1].Value = "- Thêm dòng mới phía dưới để nhập sản phẩm mới";

                var stream = new MemoryStream();
                package.SaveAs(stream);
                stream.Position = 0;

                var fileName = $"Products_Template_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
                return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tạo template Excel", error = ex.Message });
            }
        }

        // POST: api/products/import-excel
        [HttpPost("import-excel")]
        public async Task<IActionResult> ImportFromExcel(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Vui lòng chọn file Excel để upload" });
            }

            if (!file.FileName.EndsWith(".xlsx") && !file.FileName.EndsWith(".xls"))
            {
                return BadRequest(new { message = "Chỉ hỗ trợ file Excel (.xlsx, .xls)" });
            }

            try
            {
                var importResults = new List<object>();
                var errors = new List<string>();
                var successCount = 0;

                using var stream = new MemoryStream();
                await file.CopyToAsync(stream);
                stream.Position = 0;

                using var package = new ExcelPackage(stream);
                var worksheet = package.Workbook.Worksheets.FirstOrDefault();
                
                if (worksheet == null)
                {
                    return BadRequest(new { message = "File Excel không có worksheet nào" });
                }

                var rowCount = worksheet.Dimension?.Rows ?? 0;
                if (rowCount < 2)
                {
                    return BadRequest(new { message = "File Excel không có dữ liệu để import" });
                }

                // Lấy danh sách ProductGroup để validate
                var productGroups = await _context.ProductGroups.ToListAsync();
                var validGroupIds = productGroups.Select(pg => pg.ProductGroupId).ToHashSet();

                // Đọc từ hàng 2 (bỏ qua header)
                for (int row = 2; row <= rowCount; row++)
                {
                    try
                    {
                        // Đọc dữ liệu từ các cột
                        var name = worksheet.Cells[row, 1].Text?.Trim();
                        var barcode = worksheet.Cells[row, 2].Text?.Trim();
                        var priceText = worksheet.Cells[row, 3].Text?.Trim();
                        var costPriceText = worksheet.Cells[row, 4].Text?.Trim();
                        var stockText = worksheet.Cells[row, 5].Text?.Trim();
                        var minStockText = worksheet.Cells[row, 6].Text?.Trim();
                        var unit = worksheet.Cells[row, 7].Text?.Trim();
                        var description = worksheet.Cells[row, 8].Text?.Trim();
                        var productGroupIdText = worksheet.Cells[row, 9].Text?.Trim();

                        // Kiểm tra các trường bắt buộc
                        if (string.IsNullOrEmpty(name))
                        {
                            errors.Add($"Hàng {row}: Tên sản phẩm không được để trống");
                            continue;
                        }

                        if (string.IsNullOrEmpty(priceText) || !decimal.TryParse(priceText, out var price) || price < 0)
                        {
                            errors.Add($"Hàng {row}: Giá bán không hợp lệ");
                            continue;
                        }

                        if (string.IsNullOrEmpty(stockText) || !int.TryParse(stockText, out var stock) || stock < 0)
                        {
                            errors.Add($"Hàng {row}: Số lượng tồn kho không hợp lệ");
                            continue;
                        }

                        if (string.IsNullOrEmpty(productGroupIdText) || !int.TryParse(productGroupIdText, out var productGroupId) || !validGroupIds.Contains(productGroupId))
                        {
                            errors.Add($"Hàng {row}: ID Nhóm sản phẩm không hợp lệ");
                            continue;
                        }

                        // Parse các trường không bắt buộc
                        decimal.TryParse(costPriceText, out var costPrice);
                        int.TryParse(minStockText, out var minStock);
                        if (minStock <= 0) minStock = 5; // Giá trị mặc định

                        // Kiểm tra trùng mã vạch nếu có
                        if (!string.IsNullOrEmpty(barcode))
                        {
                            var existingProduct = await _context.Products.FirstOrDefaultAsync(p => p.Barcode == barcode);
                            if (existingProduct != null)
                            {
                                errors.Add($"Hàng {row}: Mã vạch {barcode} đã tồn tại trong hệ thống");
                                continue;
                            }
                        }

                        // Tạo sản phẩm mới
                        var product = new Product
                        {
                            Name = name,
                            Barcode = string.IsNullOrEmpty(barcode) ? null : barcode,
                            Price = price,
                            CostPrice = costPrice > 0 ? costPrice : null,
                            StockQuantity = stock,
                            MinStockLevel = minStock,
                            Unit = string.IsNullOrEmpty(unit) ? "chiếc" : unit,
                            Description = string.IsNullOrEmpty(description) ? null : description,
                            ProductGroupId = productGroupId
                        };

                        _context.Products.Add(product);
                        await _context.SaveChangesAsync();

                        successCount++;
                        importResults.Add(new
                        {
                            Row = row,
                            ProductId = product.ProductId,
                            Name = product.Name,
                            Status = "Success"
                        });
                    }
                    catch (Exception ex)
                    {
                        errors.Add($"Hàng {row}: Lỗi khi tạo sản phẩm - {ex.Message}");
                    }
                }

                return Ok(new
                {
                    Message = $"Import hoàn tất. Thành công: {successCount}, Lỗi: {errors.Count}",
                    SuccessCount = successCount,
                    ErrorCount = errors.Count,
                    Errors = errors,
                    Results = importResults
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi xử lý file Excel", error = ex.Message });
            }
        }
    }

    // Model cho request điều chỉnh tồn kho
    public class StockAdjustmentRequest
    {
        public int NewQuantity { get; set; }
        public string? Reason { get; set; }
    }
}
