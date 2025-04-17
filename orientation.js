// 检测是否是移动设备
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 显示提示
function showOrientationTip() {
    if (isMobile()) {
        const tip = document.getElementById('orientationTip');
        if (tip) {
            tip.classList.add('show');
            // 5秒后自动隐藏
            setTimeout(() => {
                tip.classList.remove('show');
            }, 5000);
        }
    }
}

// 关闭提示
function closeTip() {
    const tip = document.getElementById('orientationTip');
    if (tip) {
        tip.classList.remove('show');
    }
}

// 页面加载完成后显示提示
window.addEventListener('load', showOrientationTip);

// 屏幕旋转时检查方向
window.addEventListener('orientationchange', function() {
    if (window.orientation === 0) { // 竖屏
        showOrientationTip();
    }
}); 