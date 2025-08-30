using Microsoft.AspNetCore.Mvc;
using QRCoder;
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Text;

namespace RetailPointBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VietQRController : ControllerBase
    {
        // POST: api/VietQR/generate
        [HttpPost("generate")]
        public async Task<IActionResult> GenerateQR([FromBody] VietQRRequest request)
        {
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
                // Log lỗi chi tiết từ API VietQR
                Console.WriteLine($"VietQR API error: {json}");
                return BadRequest($"Không tạo được QR từ API VietQR: {json}");
            }

            var result = System.Text.Json.JsonSerializer.Deserialize<VietQRApiResponse>(json);
            if (result?.data?.qrDataURL == null)
                return BadRequest("API VietQR trả về dữ liệu không hợp lệ");
            var base64 = result.data.qrDataURL.Replace("data:image/png;base64,", "");
            var bytes = Convert.FromBase64String(base64);
            var fileName = $"vietqr_{request.AccountNumber}_{DateTime.Now.Ticks}.png";
            var filePath = Path.Combine("wwwroot/uploads", fileName);
            await System.IO.File.WriteAllBytesAsync(filePath, bytes);

            return Ok(new { qrImage = $"/uploads/{fileName}" });
        }

        // Sinh payload VietQR chuẩn (EMVCo)
        private string GenerateVietQRPayload(string bankBin, string account, decimal? amount, string? description = null)
        {
            // Sinh QR Vietcombank: chỉ nhận BIN và số tài khoản, không thêm trường mô tả
            string orgd = $"QRGD{account}01"; // ORGD + số tài khoản + 01
            string subfield01 = $"0133{bankBin}{orgd}"; // 01: BIN + ORGD...
            string subfield02 = "0208QRIBFTTA"; // 02: QRIBFTTA
            string merchantAccountInfo =
                "0010A000000727" + // 00: GUID
                subfield01 +
                subfield02;
            string mai = $"38{merchantAccountInfo.Length:D2}{merchantAccountInfo}";
            string payload =
                "000201" +
                "010211" +
                mai +
                "5303704" +
                "5802VN" +
                "6304";
            string crc = GetCRC16(payload).ToUpper();
            return payload + crc;
        }

        // Loại bỏ dấu tiếng Việt, giữ lại ký tự in hoa, không ký tự đặc biệt
        private string RemoveDiacritics(string text)
        {
            var normalized = text.Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder();
            foreach (var c in normalized)
            {
                if (System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c) != System.Globalization.UnicodeCategory.NonSpacingMark)
                {
                    if (char.IsLetterOrDigit(c) || char.IsWhiteSpace(c))
                        sb.Append(c);
                }
            }
            return sb.ToString().Normalize(NormalizationForm.FormC);
        }

        // CRC-CCITT (0xFFFF) cho EMVCo
        private string GetCRC16(string input)
        {
            ushort crc = 0xFFFF;
            foreach (byte b in Encoding.ASCII.GetBytes(input))
            {
                crc ^= (ushort)(b << 8);
                for (int i = 0; i < 8; i++)
                {
                    if ((crc & 0x8000) != 0)
                        crc = (ushort)((crc << 1) ^ 0x1021);
                    else
                        crc <<= 1;
                }
            }
            return crc.ToString("X4");
        }

        // Sinh QR base64 từ payload
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
