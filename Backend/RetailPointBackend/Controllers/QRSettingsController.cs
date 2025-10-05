using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailPointBackend.Models;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QRSettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public QRSettingsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/QRSettings
        [HttpGet]
        public async Task<IActionResult> GetQRSettings()
        {
            try
            {
                var settings = await _context.QRSettings.FirstOrDefaultAsync();
                
                if (settings == null)
                {
                    // Trả về cấu hình mặc định nếu chưa có
                    return Ok(new QRSettings());
                }

                return Ok(settings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy cấu hình QR", error = ex.Message });
            }
        }

        // POST: api/QRSettings
        [HttpPost]
        public async Task<IActionResult> SaveQRSettings([FromBody] QRSettings settings)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingSettings = await _context.QRSettings.FirstOrDefaultAsync();
                
                if (existingSettings == null)
                {
                    // Tạo mới
                    settings.CreatedAt = DateTime.Now;
                    settings.UpdatedAt = DateTime.Now;
                    _context.QRSettings.Add(settings);
                }
                else
                {
                    // Cập nhật
                    existingSettings.BankCode = settings.BankCode;
                    existingSettings.BankAccountNumber = settings.BankAccountNumber;
                    existingSettings.BankAccountHolder = settings.BankAccountHolder;
                    existingSettings.BankName = settings.BankName;
                    existingSettings.BankBranch = settings.BankBranch;
                    existingSettings.QRProvider = settings.QRProvider;
                    existingSettings.VietQRClientId = settings.VietQRClientId;
                    existingSettings.VietQRApiKey = settings.VietQRApiKey;
                    existingSettings.VNPayApiKey = settings.VNPayApiKey;
                    existingSettings.VNPaySecretKey = settings.VNPaySecretKey;
                    existingSettings.QRTemplate = settings.QRTemplate;
                    existingSettings.IsEnabled = settings.IsEnabled;
                    existingSettings.DefaultDescription = settings.DefaultDescription;
                    existingSettings.UpdatedAt = DateTime.Now;
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Đã lưu cấu hình QR thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lưu cấu hình QR", error = ex.Message });
            }
        }

        // GET: api/QRSettings/test
        [HttpGet("test")]
        public async Task<IActionResult> TestQRSettings()
        {
            try
            {
                var settings = await _context.QRSettings.FirstOrDefaultAsync();
                
                if (settings == null || !settings.IsEnabled)
                {
                    return BadRequest(new { message = "Chưa cấu hình QR hoặc QR bị tắt" });
                }

                // Kiểm tra thông tin cần thiết
                if (string.IsNullOrEmpty(settings.BankCode) || 
                    string.IsNullOrEmpty(settings.BankAccountNumber) || 
                    string.IsNullOrEmpty(settings.BankAccountHolder))
                {
                    return BadRequest(new { message = "Thiếu thông tin cấu hình QR" });
                }

                return Ok(new { 
                    message = "Cấu hình QR hợp lệ",
                    provider = settings.QRProvider,
                    bankName = settings.BankName,
                    accountHolder = settings.BankAccountHolder
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi kiểm tra cấu hình QR", error = ex.Message });
            }
        }

        // POST: api/QRSettings/generate
        [HttpPost("generate")]
        public async Task<IActionResult> GenerateQR([FromBody] GenerateQRRequest request)
        {
            try
            {
                var settings = await _context.QRSettings.FirstOrDefaultAsync();
                
                if (settings == null || !settings.IsEnabled)
                {
                    return BadRequest(new { message = "Chưa cấu hình QR hoặc QR bị tắt" });
                }

                if (request.Amount <= 0)
                {
                    return BadRequest(new { message = "Số tiền phải lớn hơn 0" });
                }

                // Chuẩn bị thông tin để tạo QR
                var qrRequest = new VietQRRequest
                {
                    BankCode = settings.BankCode,
                    AccountNumber = settings.BankAccountNumber,
                    AccountHolder = settings.BankAccountHolder,
                    Amount = request.Amount,
                    Description = !string.IsNullOrEmpty(request.Description) 
                        ? request.Description 
                        : settings.DefaultDescription
                };

                // Gọi service tạo QR (sẽ cải tiến ở bước tiếp theo)
                // Hiện tại trả về thông tin test
                return Ok(new { 
                    message = "QR được tạo thành công",
                    amount = request.Amount,
                    description = qrRequest.Description,
                    bankInfo = $"{settings.BankName} - {settings.BankAccountNumber}",
                    provider = settings.QRProvider
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi tạo QR", error = ex.Message });
            }
        }
    }

    public class GenerateQRRequest
    {
        public decimal Amount { get; set; }
        public string? Description { get; set; }
        public string? OrderId { get; set; }
    }
}