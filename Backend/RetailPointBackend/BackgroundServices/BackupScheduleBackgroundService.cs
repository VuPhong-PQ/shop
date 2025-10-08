using RetailPointBackend.Services;

namespace RetailPointBackend.BackgroundServices
{
    public class BackupScheduleBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<BackupScheduleBackgroundService> _logger;
        private readonly TimeSpan _scheduledTime = new TimeSpan(1, 0, 0); // 1:00 AM

        public BackupScheduleBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<BackupScheduleBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Background Service Backup Schedule đã khởi động");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.Now;
                    var nextRun = GetNextRunTime(now);
                    var delay = nextRun - now;

                    _logger.LogInformation("Lần backup tiếp theo: {NextRun} (sau {Delay})", 
                        nextRun.ToString("yyyy-MM-dd HH:mm:ss"), delay);

                    // Chờ đến thời gian backup hoặc cancellation
                    await Task.Delay(delay, stoppingToken);

                    if (!stoppingToken.IsCancellationRequested)
                    {
                        await ExecuteBackupJobAsync();
                    }
                }
                catch (OperationCanceledException)
                {
                    // Service đang được dừng
                    _logger.LogInformation("Background Service Backup Schedule đã được dừng");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi trong Background Service Backup Schedule");
                    
                    // Chờ 1 giờ trước khi thử lại nếu có lỗi
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }
        }

        private DateTime GetNextRunTime(DateTime now)
        {
            var today = now.Date;
            var todayScheduledTime = today.Add(_scheduledTime);

            // Nếu chưa đến giờ hôm nay thì chạy hôm nay, ngược lại chạy ngày mai
            if (now < todayScheduledTime)
            {
                return todayScheduledTime;
            }
            else
            {
                return today.AddDays(1).Add(_scheduledTime);
            }
        }

        private async Task ExecuteBackupJobAsync()
        {
            using (var scope = _serviceProvider.CreateScope())
            {
                try
                {
                    var backupService = scope.ServiceProvider.GetRequiredService<IBackupScheduleService>();
                    await backupService.ExecuteBackupAsync();
                    
                    _logger.LogInformation("Backup tự động hoàn thành thành công vào {Time}", DateTime.Now);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi thực hiện backup tự động vào {Time}", DateTime.Now);
                }
            }
        }

        public override async Task StopAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Đang dừng Background Service Backup Schedule...");
            await base.StopAsync(stoppingToken);
        }
    }
}