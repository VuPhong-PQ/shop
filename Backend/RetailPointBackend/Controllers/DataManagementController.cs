using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using RetailPointBackend.Models;
using RetailPointBackend.Services;
using System.ComponentModel.DataAnnotations;

namespace RetailPointBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DataManagementController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<DataManagementController> _logger;
        private readonly IPermissionService _permissionService;

        public DataManagementController(AppDbContext context, IConfiguration configuration, 
            ILogger<DataManagementController> logger, IPermissionService permissionService)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
            _permissionService = permissionService;
        }

        // Backup toàn bộ database
        [HttpPost("backup")]
        public async Task<IActionResult> BackupDatabase([FromBody] BackupRequestDto request)
        {
            try
            {
                // Check permission (temporary simple check - should implement proper JWT authentication)
                var staffIdHeader = Request.Headers["StaffId"].FirstOrDefault();
                if (!int.TryParse(staffIdHeader, out int staffId) || 
                    !await _permissionService.HasPermissionAsync(staffId, "BackupDatabase"))
                {
                    return Forbid("Bạn không có quyền sao lưu dữ liệu");
                }
                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                var sqlConnectionStringBuilder = new SqlConnectionStringBuilder(connectionString);
                var databaseName = sqlConnectionStringBuilder.InitialCatalog;
                var serverName = sqlConnectionStringBuilder.DataSource;

                // Tạo tên file backup với timestamp
                var timestamp = DateTime.Now.ToString("yyyyMMdd_HHmmss");
                var backupFileName = $"{databaseName}_backup_{timestamp}.bak";
                var backupPath = Path.Combine(request.BackupPath ?? @"C:\temp", backupFileName);

                // Tạo thư mục nếu chưa tồn tại
                Directory.CreateDirectory(Path.GetDirectoryName(backupPath)!);

                // Câu lệnh backup SQL
                var backupQuery = $@"
                    BACKUP DATABASE [{databaseName}] 
                    TO DISK = '{backupPath}' 
                    WITH FORMAT, INIT, NAME = 'Full Backup of {databaseName}', 
                    SKIP, NOREWIND, NOUNLOAD, STATS = 10";

                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    using (var command = new SqlCommand(backupQuery, connection))
                    {
                        command.CommandTimeout = 300; // 5 phút timeout
                        await command.ExecuteNonQueryAsync();
                    }
                }

                return Ok(new { 
                    message = "Backup database thành công", 
                    backupPath = backupPath,
                    fileName = backupFileName,
                    timestamp = timestamp
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi backup database");
                return StatusCode(500, new { message = "Lỗi khi backup database", error = ex.Message });
            }
        }

        // Restore database từ file backup
        [HttpPost("restore")]
        public async Task<IActionResult> RestoreDatabase([FromBody] RestoreRequestDto request)
        {
            try
            {
                // Check permission
                var staffIdHeader = Request.Headers["StaffId"].FirstOrDefault();
                if (!int.TryParse(staffIdHeader, out int staffId) || 
                    !await _permissionService.HasPermissionAsync(staffId, "RestoreDatabase"))
                {
                    return Forbid("Bạn không có quyền phục hồi dữ liệu");
                }
                if (!System.IO.File.Exists(request.BackupFilePath))
                {
                    return BadRequest(new { message = "File backup không tồn tại" });
                }

                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                var sqlConnectionStringBuilder = new SqlConnectionStringBuilder(connectionString);
                var databaseName = sqlConnectionStringBuilder.InitialCatalog;

                // Đóng tất cả kết nối đến database
                var killConnectionsQuery = $@"
                    ALTER DATABASE [{databaseName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE";

                // Câu lệnh restore SQL
                var restoreQuery = $@"
                    RESTORE DATABASE [{databaseName}] 
                    FROM DISK = '{request.BackupFilePath}' 
                    WITH REPLACE";

                // Đặt lại multi-user mode
                var setMultiUserQuery = $@"
                    ALTER DATABASE [{databaseName}] SET MULTI_USER";

                using (var connection = new SqlConnection(connectionString))
                {
                    await connection.OpenAsync();
                    
                    // Đóng các kết nối khác
                    using (var killCommand = new SqlCommand(killConnectionsQuery, connection))
                    {
                        await killCommand.ExecuteNonQueryAsync();
                    }
                    
                    // Restore database
                    using (var restoreCommand = new SqlCommand(restoreQuery, connection))
                    {
                        restoreCommand.CommandTimeout = 600; // 10 phút timeout
                        await restoreCommand.ExecuteNonQueryAsync();
                    }
                    
                    // Đặt lại multi-user mode
                    using (var multiUserCommand = new SqlCommand(setMultiUserQuery, connection))
                    {
                        await multiUserCommand.ExecuteNonQueryAsync();
                    }
                }

                return Ok(new { 
                    message = "Restore database thành công",
                    restoredFrom = request.BackupFilePath
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi restore database");
                return StatusCode(500, new { message = "Lỗi khi restore database", error = ex.Message });
            }
        }

        // Xóa dữ liệu bán hàng (giữ lại sản phẩm, nhóm hàng)
        [HttpDelete("sales-data")]
        public async Task<IActionResult> DeleteSalesData([FromBody] DeleteConfirmationDto confirmation)
        {
            try
            {
                // Check permission
                var staffIdHeader = Request.Headers["StaffId"].FirstOrDefault();
                if (!int.TryParse(staffIdHeader, out int staffId) || 
                    !await _permissionService.HasPermissionAsync(staffId, "DeleteSalesData"))
                {
                    return Forbid("Bạn không có quyền xóa dữ liệu bán hàng");
                }
                if (confirmation.ConfirmationText != "DELETE SALES DATA")
                {
                    return BadRequest(new { message = "Vui lòng nhập đúng text xác nhận: DELETE SALES DATA" });
                }

                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        // Xóa order items trước
                        await _context.Database.ExecuteSqlRawAsync("DELETE FROM OrderItems");
                        
                        // Xóa orders
                        await _context.Database.ExecuteSqlRawAsync("DELETE FROM Orders");
                        
                        // Xóa customers
                        await _context.Database.ExecuteSqlRawAsync("DELETE FROM Customers");
                        
                        // Xóa inventory movements
                        await _context.Database.ExecuteSqlRawAsync("DELETE FROM InventoryMovements");
                        
                        // Reset inventory quantities về 0
                        await _context.Database.ExecuteSqlRawAsync("UPDATE Products SET StockQuantity = 0");
                        
                        // Xóa các bảng báo cáo nếu có
                        // await _context.Database.ExecuteSqlRawAsync("DELETE FROM Reports");
                        
                        // Reset identity columns
                        await _context.Database.ExecuteSqlRawAsync("DBCC CHECKIDENT ('Orders', RESEED, 0)");
                        await _context.Database.ExecuteSqlRawAsync("DBCC CHECKIDENT ('OrderItems', RESEED, 0)");
                        await _context.Database.ExecuteSqlRawAsync("DBCC CHECKIDENT ('Customers', RESEED, 0)");
                        await _context.Database.ExecuteSqlRawAsync("DBCC CHECKIDENT ('InventoryMovements', RESEED, 0)");

                        await transaction.CommitAsync();

                        return Ok(new { 
                            message = "Đã xóa toàn bộ dữ liệu bán hàng thành công. Sản phẩm và nhóm hàng được giữ lại.",
                            timestamp = DateTime.Now
                        });
                    }
                    catch
                    {
                        await transaction.RollbackAsync();
                        throw;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa dữ liệu bán hàng");
                return StatusCode(500, new { message = "Lỗi khi xóa dữ liệu bán hàng", error = ex.Message });
            }
        }

        // Xóa toàn bộ dữ liệu
        [HttpDelete("all-data")]
        public async Task<IActionResult> DeleteAllData([FromBody] DeleteConfirmationDto confirmation)
        {
            try
            {
                // Check permission
                var staffIdHeader = Request.Headers["StaffId"].FirstOrDefault();
                if (!int.TryParse(staffIdHeader, out int staffId) || 
                    !await _permissionService.HasPermissionAsync(staffId, "DeleteAllData"))
                {
                    return Forbid("Bạn không có quyền xóa toàn bộ dữ liệu");
                }
                if (confirmation.ConfirmationText != "DELETE ALL DATA")
                {
                    return BadRequest(new { message = "Vui lòng nhập đúng text xác nhận: DELETE ALL DATA" });
                }

                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        // Disable foreign key constraints
                        await _context.Database.ExecuteSqlRawAsync("EXEC sp_MSforeachtable \"ALTER TABLE ? NOCHECK CONSTRAINT all\"");
                        
                        // Xóa theo thứ tự từ child tables đến parent tables
                        await _context.Database.ExecuteSqlRawAsync("DELETE FROM OrderItems");
                        await _context.Database.ExecuteSqlRawAsync("DELETE FROM Orders");
                        await _context.Database.ExecuteSqlRawAsync("DELETE FROM Customers");
                        await _context.Database.ExecuteSqlRawAsync("DELETE FROM InventoryMovements");
                        await _context.Database.ExecuteSqlRawAsync("DELETE FROM Products");
                        await _context.Database.ExecuteSqlRawAsync("DELETE FROM ProductGroups");
                        await _context.Database.ExecuteSqlRawAsync("DELETE FROM Categories");
                        await _context.Database.ExecuteSqlRawAsync("DELETE FROM StaffGroupPermissions");
                        await _context.Database.ExecuteSqlRawAsync("DELETE FROM RolePermissions");
                        await _context.Database.ExecuteSqlRawAsync("DELETE FROM Staff");
                        await _context.Database.ExecuteSqlRawAsync("DELETE FROM StaffGroups");
                        await _context.Database.ExecuteSqlRawAsync("DELETE FROM Roles");
                        // Không xóa Permissions vì đây là dữ liệu cấu hình hệ thống
                        
                        // Reset identity columns
                        var identityTables = new[]
                        {
                            "Orders", "OrderItems", "Customers", "InventoryMovements", 
                            "Products", "ProductGroups", "Categories", 
                            "Staff", "StaffGroups", "Roles"
                        };
                        
                        foreach (var table in identityTables)
                        {
                            // Use safe SQL to avoid injection warnings
                            var sql = $"DBCC CHECKIDENT ('{table}', RESEED, 0)";
                            await _context.Database.ExecuteSqlRawAsync(sql);
                        }
                        
                        // Re-enable foreign key constraints
                        await _context.Database.ExecuteSqlRawAsync("EXEC sp_MSforeachtable \"ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all\"");

                        await transaction.CommitAsync();

                        return Ok(new { 
                            message = "Đã xóa toàn bộ dữ liệu thành công. Chỉ giữ lại cấu hình permissions.",
                            timestamp = DateTime.Now
                        });
                    }
                    catch
                    {
                        await transaction.RollbackAsync();
                        throw;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi xóa toàn bộ dữ liệu");
                return StatusCode(500, new { message = "Lỗi khi xóa toàn bộ dữ liệu", error = ex.Message });
            }
        }

        // Lấy thông tin database
        [HttpGet("database-info")]
        public async Task<IActionResult> GetDatabaseInfo()
        {
            try
            {
                // Check permission
                var staffIdHeader = Request.Headers["StaffId"].FirstOrDefault();
                if (!int.TryParse(staffIdHeader, out int staffId) || 
                    !await _permissionService.HasPermissionAsync(staffId, "ViewDataManagement"))
                {
                    return Forbid("Bạn không có quyền xem thông tin dữ liệu");
                }

                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                if (string.IsNullOrEmpty(connectionString))
                {
                    return BadRequest(new { message = "Connection string không được cấu hình" });
                }

                try
                {
                    var sqlConnectionStringBuilder = new SqlConnectionStringBuilder(connectionString);
                    var databaseName = sqlConnectionStringBuilder.InitialCatalog;
                    var serverName = sqlConnectionStringBuilder.DataSource;
                    
                    // Sử dụng Entity Framework để lấy thông tin đơn giản
                    var dbName = await _context.Database.SqlQueryRaw<string>("SELECT DB_NAME()").FirstOrDefaultAsync();
                    
                    return Ok(new {
                        databaseName = dbName ?? databaseName ?? "Unknown",
                        sizeMB = 0.0, // Tạm thời để 0, sẽ implement sau
                        serverName = serverName ?? "localhost",
                        lastBackup = "Chưa có thông tin"
                    });
                }
                catch (Exception sqlEx)
                {
                    _logger.LogError(sqlEx, "Lỗi kết nối SQL Server");
                    
                    // Fallback: trả về thông tin cơ bản từ connection string
                    try
                    {
                        var sqlConnectionStringBuilder = new SqlConnectionStringBuilder(connectionString);
                        return Ok(new {
                            databaseName = sqlConnectionStringBuilder.InitialCatalog ?? "RetailPointDB",
                            sizeMB = 0.0,
                            serverName = sqlConnectionStringBuilder.DataSource ?? "localhost",
                            lastBackup = "Không thể kết nối để kiểm tra"
                        });
                    }
                    catch
                    {
                        return Ok(new {
                            databaseName = "RetailPointDB",
                            sizeMB = 0.0,
                            serverName = "localhost",
                            lastBackup = "Không thể lấy thông tin"
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi lấy thông tin database");
                return StatusCode(500, new { message = "Lỗi khi lấy thông tin database", error = ex.Message });
            }
        }
    }

    // DTOs
    public class BackupRequestDto
    {
        public string? BackupPath { get; set; }
    }

    public class RestoreRequestDto
    {
        [Required]
        public string BackupFilePath { get; set; } = string.Empty;
    }

    public class DeleteConfirmationDto
    {
        [Required]
        public string ConfirmationText { get; set; } = string.Empty;
    }
}