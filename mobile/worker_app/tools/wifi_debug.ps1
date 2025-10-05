param(
    [string]$Device = "",
    [int]$Port = 5000,
    [string]$HostIp = "",
    [string[]]$FlutterArgs
)

function Resolve-HostIp {
    param([string]$ExplicitIp)

    if ($ExplicitIp) {
        return $ExplicitIp
    }

    $addresses = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object {
            $_.IPAddress -notmatch '^(169\.254|127\.)' -and
            $_.PrefixOrigin -ne 'WellKnown'
        } |
        Sort-Object -Property InterfaceMetric

    $wifi = $addresses |
        Where-Object { $_.InterfaceAlias -match 'Wi-?Fi|Wireless' } |
        Select-Object -First 1

    if ($wifi) {
        return $wifi.IPAddress
    }

    $first = $addresses | Select-Object -First 1
    if ($first) {
        return $first.IPAddress
    }

    throw 'Không tìm thấy IPv4 hợp lệ. Hãy truyền thủ công bằng tham số -HostIp.'
}

function Resolve-DeviceId {
    param([string]$PreferredId)

    $adbOutput = & adb devices
    if ($LASTEXITCODE -ne 0) {
        throw 'Không gọi được lệnh adb. Đảm bảo Android platform-tools đã cài đặt và adb nằm trong PATH.'
    }

    $ids = @()
    foreach ($line in $adbOutput) {
        if ($line -match '^(?<id>\S+)\s+device$') {
            $ids += $Matches['id']
        }
    }

    if ($PreferredId) {
        if ($ids -contains $PreferredId) {
            return $PreferredId
        }

        throw "Thiết bị '$PreferredId' chưa được adb nhận diện. Kiểm tra lại trạng thái kết nối."
    }

    if ($ids.Count -eq 0) {
        throw 'Không phát hiện thiết bị ADB nào đang online. Hãy dùng "adb connect" hoặc kiểm tra lại kết nối.'
    }

    if ($ids.Count -gt 1) {
        throw 'Phát hiện nhiều thiết bị ADB. Truyền thiết bị cụ thể bằng tham số -Device.'
    }

    return $ids[0]
}

try {
    if ($Device -and $Device -match '^\d+\.\d+\.\d+\.\d+:\d+$') {
        Write-Host "Đang kết nối ADB tới $Device ..." -ForegroundColor DarkGray
        & adb connect $Device | Write-Host
        if ($LASTEXITCODE -ne 0) {
            throw "Không thể adb connect tới $Device"
        }
    }

    $resolvedHostIp = Resolve-HostIp -ExplicitIp $HostIp
    $apiBase = "http://$resolvedHostIp:$Port"
    Write-Host "Sử dụng API base: $apiBase" -ForegroundColor Cyan

    $deviceId = Resolve-DeviceId -PreferredId $Device
    Write-Host "Thiết bị ADB đang dùng: $deviceId" -ForegroundColor DarkGray

    $reverseArgs = @('reverse', "tcp:$Port", "tcp:$Port")
    if ($deviceId) {
        $reverseArgs = @('-s', $deviceId) + $reverseArgs
    }

    Write-Host "Thiết lập adb reverse tcp:$Port" -ForegroundColor DarkGray
    & adb @reverseArgs | Write-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Warning 'Không thể thiết lập adb reverse. Bạn có thể bỏ qua nếu backend của bạn có thể truy cập trực tiếp.'
    }

    $flutterArgsList = @('run', '--dart-define', "API_BASE=$apiBase", '--dart-define', "SOCKET_BASE=$apiBase")

    if ($deviceId) {
        $flutterArgsList += @('-d', $deviceId)
    }

    if ($FlutterArgs) {
        $flutterArgsList += $FlutterArgs
    }

    Write-Host "Chạy: flutter $($flutterArgsList -join ' ')" -ForegroundColor Cyan
    & flutter @flutterArgsList
    exit $LASTEXITCODE
} catch {
    Write-Error $_
    exit 1
}
