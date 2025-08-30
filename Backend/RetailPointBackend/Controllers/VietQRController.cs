using Microsoft.AspNetCore.Mvc;
using QRCoder;
using System;
using System.Drawing;
using System.IO;
using System.Threading.Tasks;
using System.Net.Http;
using System.Net.Http.Json;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VietQRController : ControllerBase
    {
        // Endpoint: POST api/VietQR/generate
        [HttpPost("generate")]
        public async Task<IActionResult> GenerateQR([FromBody] VietQRRequest request)
        {
            // Thông tin API key demo (có thể lấy từ config)
            var client = new HttpClient();
            client.DefaultRequestHeaders.Add("x-client-id", "487346d7-ebb2-4bf0-97a0-13ad72cff87a");
            client.DefaultRequestHeaders.Add("x-api-key", "b3a63288-6624-4a0e-abca-c3c0a43390fe");

            var payload = new
            {
                accountNo = request.AccountNumber,
                accountName = request.AccountHolder,
                bankCode = request.BankCode,
                amount = request.Amount,
                addInfo = request.Description,
                template = "compact"
            };

            var response = await client.PostAsJsonAsync("https://api.vietqr.io/v2/generate", payload);
            var json = await response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                return BadRequest($"Không tạo được QR từ API VietQR: {json}");
            }

            var result = System.Text.Json.JsonSerializer.Deserialize<VietQRApiResponse>(json);
            if (result?.data?.qrDataURL == null)
                return BadRequest("API VietQR trả về dữ liệu không hợp lệ");
            var base64 = result.data.qrDataURL.Replace("data:image/png;base64,", "");
            var bytes = Convert.FromBase64String(base64);
            var fileName = $"vietqr_{request.AccountNumber}_{DateTime.Now.Ticks}.png";
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);
            var filePath = Path.Combine(uploadsFolder, fileName);
            await System.IO.File.WriteAllBytesAsync(filePath, bytes);

            return Ok(new { qrImage = $"/uploads/{fileName}" });
        }

        // Endpoint: GET api/VietQR/test-qrcode
        [HttpGet("test-qrcode")]
        public IActionResult GenerateTestQrCode()
        {
            var clientId = "487346d7-ebb2-4bf0-97a0-13ad72cff87a";
            var apiKey = "b3a63288-6624-4a0e-abca-c3c0a43390fe";
            var qrContent = $"ClientID: {clientId} | APIKey: {apiKey}";
            var base64 = GenerateQrBase64(qrContent);
            return Ok(new { qrBase64 = base64 });
        }

        private string GenerateQrBase64(string payload)
        {
            using (var qrGenerator = new QRCodeGenerator())
            using (var qrData = qrGenerator.CreateQrCode(payload, QRCodeGenerator.ECCLevel.Q))
            {
                var qrCode = new BitmapByteQRCode(qrData);
                var qrBytes = qrCode.GetGraphic(20);
                return "data:image/png;base64," + Convert.ToBase64String(qrBytes);
            }
        }
    }

    public class VietQRRequest
    {
        public string BankCode { get; set; } = string.Empty;
        public string AccountNumber { get; set; } = string.Empty;
        public string AccountHolder { get; set; } = string.Empty;
        public decimal? Amount { get; set; }
        public string? Description { get; set; }
    }

    public class VietQRApiResponse
    {
        public VietQRData? data { get; set; }
    }

    public class VietQRData
    {
        public string? qrDataURL { get; set; }
        public string? accountNo { get; set; }
        public string? accountName { get; set; }
        public string? bankCode { get; set; }
        public string? amount { get; set; }
        public string? addInfo { get; set; }
    }
}
