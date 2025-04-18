const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('gameOver');
const countdownElement = document.getElementById('countdown');
const countdownNumberElement = document.getElementById('countdownNumber');
const finalScoreElement = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

// 设置画布大小
canvas.width = 480;
canvas.height = 480;

// 加载小蜜蜂图片
const beeImage = new Image();
const cloud1Image = new Image();
const cloud2Image = new Image();
const linder1Image = new Image(); // 底部障碍物
const linder2Image = new Image(); // 顶部障碍物
const footerImage = new Image();
const startImage = new Image();

// 图片加载计数器
let loadedImages = 0;
const totalImages = 7; // 更新为7个图片

// 图片加载处理函数
function handleImageLoad() {
    loadedImages++;
    if (loadedImages === totalImages) {
        console.log('所有图片加载完成');
        // 初始化游戏
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        drawGround();
        bee.draw();
    }
}

// 图片加载错误处理
function handleImageError(imageName) {
    console.error(`${imageName} 加载失败`);
}

// 设置图片加载事件
beeImage.onload = handleImageLoad;
beeImage.onerror = () => handleImageError('蜜蜂图片');
beeImage.src = 'images/bee.png';

cloud1Image.onload = handleImageLoad;
cloud1Image.onerror = () => handleImageError('云朵1图片');
cloud1Image.src = 'images/cloud1.png';

cloud2Image.onload = handleImageLoad;
cloud2Image.onerror = () => handleImageError('云朵2图片');
cloud2Image.src = 'images/cloud2.png';

linder1Image.onload = handleImageLoad;
linder1Image.onerror = () => handleImageError('底部障碍物图片');
linder1Image.src = 'images/linder1.svg';

linder2Image.onload = handleImageLoad;
linder2Image.onerror = () => handleImageError('顶部障碍物图片');
linder2Image.src = 'images/linder2.svg';

footerImage.onload = handleImageLoad;
footerImage.onerror = () => handleImageError('地面图片');
footerImage.src = 'images/footer.svg';

startImage.onload = handleImageLoad;
startImage.onerror = () => handleImageError('开始界面图片');
startImage.src = 'images/start.jpeg';

// 云朵对象数组
let clouds = [];

// 云朵类
class Cloud {
    constructor() {
        const imageLoaded = cloud1Image.complete && cloud2Image.complete;
        if (!imageLoaded) {
            console.warn('云朵图片未完全加载');
        }
        this.image = Math.random() < 0.5 ? cloud1Image : cloud2Image;
        this.width = 80;
        this.height = 40;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - this.height);
        this.speed = 0.5 + Math.random() * 0.5;
    }

    update() {
        this.x -= this.speed;
        return this.x + this.width > 0; // 返回是否仍在画布内
    }

    draw() {
        if (this.image.complete) {
            // 保存当前上下文状态
            ctx.save();
            // 设置透明度为50%
            ctx.globalAlpha = 0.5;
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            // 恢复上下文状态
            ctx.restore();
        }
    }
}

// 游戏参数
const gravity = 0.28;
const jumpForce = -5;
const pipeWidth = 73;
const pipeGap = 170;
const pipeSpeed = 2.5;
const pipeSpawnInterval = 2000;

// 行业列表
const industries = ['制造', '快消', '高服', '金融', '教育', '医疗', '能源', '物流', '农贸', '家居', '电子'];

// 小蜜蜂对象
const bee = {
    x: 50,
    y: canvas.height / 2,
    width: 40,
    height: 40,
    velocity: 0,
    draw() {
        if (beeImage.complete) {
            ctx.drawImage(beeImage, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        } else {
            // 如果图片未加载，绘制一个占位符
            ctx.fillStyle = 'yellow';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        }
    },
    update() {
        this.velocity += gravity;
        this.y += this.velocity;
        
        // 防止小蜜蜂飞出画布顶部
        if (this.y < this.height/2) {
            this.y = this.height/2;
            this.velocity = 0;
        }
        
        // 防止小蜜蜂飞出画布底部
        if (this.y > canvas.height - this.height/2) {
            this.y = canvas.height - this.height/2;
            gameOver();
        }
    },
    jump() {
        this.velocity = jumpForce;
    }
};

// 游戏状态
let pipes = [];
let score = 0;
let gameLoop;
let pipeSpawnTimer;
let gameStarted = false;
let canStartGame = true;

// 地面滚动位置
let groundX = 0;

// 创建视频元素
const endingVideo = document.createElement('video');
endingVideo.src = 'images/ending.mp4';
endingVideo.style.position = 'absolute';
endingVideo.style.width = '100%';
endingVideo.style.height = '100%';
endingVideo.style.objectFit = 'contain';
endingVideo.style.backgroundColor = 'black';
endingVideo.playsInline = true;
// 默认不设置静音
endingVideo.style.display = 'none';

// 将视频添加到canvas的父元素中
canvas.parentElement.appendChild(endingVideo);

// 创建开始界面
const startScreen = document.createElement('div');
startScreen.style.position = 'absolute';
startScreen.style.top = '0';
startScreen.style.left = '0';
startScreen.style.width = '100%';
startScreen.style.height = '100%';
startScreen.style.display = 'flex';
startScreen.style.justifyContent = 'center';
startScreen.style.alignItems = 'center';
startScreen.style.cursor = 'pointer';
canvas.parentElement.appendChild(startScreen);

// 设置开始界面背景
startScreen.style.backgroundImage = `url(${startImage.src})`;
startScreen.style.backgroundSize = 'cover';
startScreen.style.backgroundPosition = 'center';

// 创建警告通知条
const warningBar = document.createElement('div');
warningBar.style.position = 'fixed';
warningBar.style.top = '20px';
warningBar.style.left = '50%';
warningBar.style.transform = 'translateX(-50%)';
warningBar.style.backgroundColor = '#FFF9E6';
warningBar.style.padding = '12px 16px';
warningBar.style.borderRadius = '8px';
warningBar.style.display = 'flex';
warningBar.style.alignItems = 'center';
warningBar.style.gap = '8px';
warningBar.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
warningBar.style.zIndex = '1000';

// 创建警告图标
const warningIcon = document.createElement('span');
warningIcon.innerHTML = '⚠️';
warningIcon.style.fontSize = '16px';

// 创建警告文本
const warningText = document.createElement('span');
warningText.textContent = '本页面仅作为游戏测试使用，登录功能不可用';
warningText.style.color = '#854D0E';
warningText.style.fontSize = '14px';
warningText.style.fontFamily = 'system-ui, -apple-system, sans-serif';

// 创建关闭按钮
const closeButton = document.createElement('button');
closeButton.innerHTML = '×';
closeButton.style.marginLeft = '16px';
closeButton.style.background = 'none';
closeButton.style.border = 'none';
closeButton.style.color = '#854D0E';
closeButton.style.fontSize = '20px';
closeButton.style.cursor = 'pointer';
closeButton.style.padding = '0';
closeButton.style.display = 'flex';
closeButton.style.alignItems = 'center';
closeButton.style.justifyContent = 'center';
closeButton.style.width = '24px';
closeButton.style.height = '24px';

// 添加关闭功能
closeButton.onclick = () => {
    warningBar.style.display = 'none';
};

// 组装通知条
warningBar.appendChild(warningIcon);
warningBar.appendChild(warningText);
warningBar.appendChild(closeButton);

// 添加到页面
document.body.appendChild(warningBar);

// 修改开始倒计时函数
function startCountdown() {
    if (!canStartGame) return;
    canStartGame = false;
    let count = 3;
    countdownElement.classList.remove('hidden');
    startScreen.style.display = 'none'; // 隐藏开始界面
    
    const countInterval = setInterval(() => {
        countdownNumberElement.textContent = count;
        if (count <= 0) {
            clearInterval(countInterval);
            countdownElement.classList.add('hidden');
            startGame();
        }
        count--;
    }, 500); // 从1000ms改为500ms，加快倒计时速度
    
    countdownNumberElement.textContent = count;
}

// 创建新管道
function createPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - pipeGap - minHeight;
    const height = Math.floor(minHeight + (Math.random() * 0.6 + 0.2) * (maxHeight - minHeight));
    
    // 随机选择一个行业
    const industry = industries[Math.floor(Math.random() * industries.length)];
    
    pipes.push({
        x: canvas.width,
        y: 0,
        width: pipeWidth,
        height: height,
        passed: false,
        industry: industry
    });
    
    pipes.push({
        x: canvas.width,
        y: height + pipeGap,
        width: pipeWidth,
        height: canvas.height - height - pipeGap,
        passed: false,
        industry: industry // 上下管道使用相同的行业文字
    });
}

// 绘制背景
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#C2DEFF');
    gradient.addColorStop(0.7644, '#FFF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 绘制地面
function drawGround() {
    const groundHeight = 62;
    const groundY = canvas.height - groundHeight;
    
    // 绘制两次地面图片以实现无缝滚动
    ctx.drawImage(footerImage, groundX, groundY, canvas.width, groundHeight);
    ctx.drawImage(footerImage, groundX + canvas.width, groundY, canvas.width, groundHeight);
    
    // 更新地面位置
    if (gameStarted) {
        groundX -= pipeSpeed;
        // 当第一张图片完全滚出画面时，重置位置
        if (groundX <= -canvas.width) {
            groundX = 0;
        }
    }
}

// 绘制管道
function drawPipes() {
    pipes.forEach(pipe => {
        if (pipe.y === 0) {
            // 上方管道，使用linder2
            ctx.drawImage(linder2Image, pipe.x, pipe.y, pipe.width, pipe.height);
        } else {
            // 下方管道，使用linder1
            ctx.drawImage(linder1Image, pipe.x, pipe.y, pipe.width, pipe.height);
        }
        
        // 绘制行业文字
        ctx.save();
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        
        if (pipe.y === 0) {
            // 上方管道文字，垂直居中
            const textY = pipe.y + pipe.height - 60; // 距离底部60像素
            ctx.fillText(pipe.industry, pipe.x + pipe.width/2, textY);
        } else {
            // 下方管道文字，垂直居中
            const textY = pipe.y + 60; // 距离顶部60像素
            ctx.fillText(pipe.industry, pipe.x + pipe.width/2, textY);
        }
        ctx.restore();
    });
}

// 更新管道位置
function updatePipes() {
    const groundHeight = 62;
    
    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;
        
        // 检查是否通过管道，只在上方管道计分
        if (!pipe.passed && pipe.x + pipe.width < bee.x && pipe.y === 0) {
            pipe.passed = true;
            score++;
            scoreElement.textContent = `分数: ${score}`;
            console.log('当前分数：', score); // 调试用
            
            // 检查是否达到26分
            if (score >= 26) {
                showEnding();
                return;
            }
        }
        
        // 检查碰撞
        if (
            bee.x + bee.width/2 > pipe.x &&
            bee.x - bee.width/2 < pipe.x + pipe.width &&
            (bee.y - bee.height/2 < pipe.y + pipe.height &&
             bee.y + bee.height/2 > pipe.y)
        ) {
            gameOver();
        }
    });
    
    // 检查地面碰撞
    if (bee.y + bee.height/2 > canvas.height - groundHeight) {
        gameOver();
    }
    
    // 移除超出屏幕的管道
    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);
}

// 游戏结束
function gameOver() {
    clearInterval(gameLoop);
    clearInterval(pipeSpawnTimer);
    finalScoreElement.textContent = score;
    gameOverElement.classList.remove('hidden');
    gameStarted = false;
    canStartGame = true;
}

// 显示结算视频
function showEnding() {
    clearInterval(gameLoop);
    clearInterval(pipeSpawnTimer);
    gameStarted = false;
    canStartGame = false;
    
    // 隐藏游戏画布，显示视频
    canvas.style.display = 'none';
    endingVideo.style.display = 'block';
    
    // 确保视频从头开始播放
    endingVideo.currentTime = 0;
    
    // 尝试播放视频（首先尝试有声音播放）
    endingVideo.muted = false;
    const playPromise = endingVideo.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('视频开始播放（有声音）');
        }).catch(error => {
            console.log('有声音播放失败，尝试静音播放');
            // 如果有声音播放失败，尝试静音播放
            endingVideo.muted = true;
            endingVideo.play().then(() => {
                // 如果静音播放成功，显示提示让用户点击启用声音
                const enableAudioMessage = document.createElement('div');
                enableAudioMessage.style.position = 'absolute';
                enableAudioMessage.style.top = '20px';
                enableAudioMessage.style.left = '50%';
                enableAudioMessage.style.transform = 'translateX(-50%)';
                enableAudioMessage.style.color = 'white';
                enableAudioMessage.style.padding = '10px';
                enableAudioMessage.style.borderRadius = '5px';
                enableAudioMessage.style.backgroundColor = 'rgba(0,0,0,0.7)';
                enableAudioMessage.textContent = '点击视频启用声音';
                canvas.parentElement.appendChild(enableAudioMessage);
                
                // 点击视频时启用声音
                const enableAudio = () => {
                    endingVideo.muted = false;
                    enableAudioMessage.remove();
                    endingVideo.removeEventListener('click', enableAudio);
                };
                endingVideo.addEventListener('click', enableAudio);
                
                // 视频结束时移除提示和事件监听
                endingVideo.addEventListener('ended', () => {
                    enableAudioMessage.remove();
                    endingVideo.removeEventListener('click', enableAudio);
                }, { once: true });
            }).catch(e => {
                console.error('静音播放也失败:', e);
                alert('点击屏幕开始播放视频');
            });
        });
    }
    
    // 视频播放结束后的处理
    endingVideo.onended = () => {
        console.log('视频播放结束');
        endingVideo.style.display = 'none';
        canvas.style.display = 'block';
        canStartGame = true;
        restartGame();
    };
}

// 修改重新开始游戏函数
function restartGame() {
    bee.y = canvas.height / 2;
    bee.velocity = 0;
    pipes = [];
    clouds = [];
    score = 0;
    groundX = 0;
    scoreElement.textContent = `分数: ${score}`;
    gameOverElement.classList.add('hidden');
    canvas.style.display = 'block';
    endingVideo.style.display = 'none';
    startScreen.style.display = 'none'; // 保持开始界面隐藏
    startCountdown(); // 直接开始倒计时
}

// 开始游戏
function startGame() {
    gameStarted = true;
    groundX = 0; // 重置地面位置
    
    // 初始化云朵
    for (let i = 0; i < 2; i++) {
        clouds.push(new Cloud());
    }
    
    gameLoop = setInterval(() => {
        // 清除画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制背景
        drawBackground();
        
        // 更新和绘制云朵
        clouds = clouds.filter(cloud => cloud.update());
        clouds.forEach(cloud => cloud.draw());
        
        // 随机添加新云朵
        if (Math.random() < 0.002 && clouds.length < 3) {
            clouds.push(new Cloud());
        }
        
        bee.update();
        bee.draw();
        
        updatePipes();
        drawPipes();
        
        // 绘制地面
        drawGround();
    }, 1000 / 60);
    
    pipeSpawnTimer = setInterval(createPipe, pipeSpawnInterval);
}

// 事件监听
canvas.addEventListener('click', () => {
    if (!gameStarted && canStartGame) {
        startCountdown();
    } else if (gameStarted) {
        bee.jump();
    }
});

// 添加空格键控制
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault();
        if (!gameStarted && canStartGame) {
            startCountdown();
        } else if (gameStarted) {
            bee.jump();
        }
    }
});

// 修改重启按钮样式
restartButton.style.background = 'linear-gradient(154deg, #FF8C8C 4.1%, #FF4848 99.89%)';
restartButton.style.border = 'none';
restartButton.style.color = '#FFF';
restartButton.style.borderRadius = '50%';
restartButton.style.width = '120px';
restartButton.style.height = '120px';
restartButton.style.cursor = 'pointer';
restartButton.style.fontSize = '24px';
restartButton.style.fontStyle = 'normal';
restartButton.style.fontWeight = '400';
restartButton.style.lineHeight = 'normal';
restartButton.style.display = 'flex';
restartButton.style.justifyContent = 'center';
restartButton.style.alignItems = 'center';
restartButton.style.padding = '0';
restartButton.style.outline = 'none';
restartButton.style.position = 'relative';
restartButton.style.transition = 'all 0.3s ease';
restartButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
restartButton.textContent = '再次冲刺';

// 添加悬停效果
restartButton.onmouseover = () => {
    restartButton.style.transform = 'scale(1.1)';
};

restartButton.onmouseout = () => {
    restartButton.style.transform = 'scale(1)';
};

// 添加重启事件监听
restartButton.addEventListener('click', restartGame);

// 添加点击事件处理视频自动播放问题
document.addEventListener('click', () => {
    if (endingVideo.style.display === 'block' && endingVideo.paused) {
        // 尝试有声音播放
        endingVideo.muted = false;
        endingVideo.play().catch(error => {
            console.log('点击后有声音播放失败，尝试静音播放');
            endingVideo.muted = true;
            endingVideo.play().catch(e => {
                console.error('点击后静音播放也失败:', e);
            });
        });
    }
});

// 初始化游戏
function initGame() {
    // 创建操作提示
    const gameTip = document.createElement('div');
    gameTip.style.position = 'absolute';
    gameTip.style.bottom = '10px';
    gameTip.style.left = '50%';
    gameTip.style.transform = 'translateX(-50%)';
    gameTip.style.textAlign = 'center';
    gameTip.style.padding = '10px';
    gameTip.style.color = '#fff';
    gameTip.style.fontSize = '12px';
    gameTip.textContent = '点击鼠标左键or键盘空格 进行游戏';
    canvas.parentElement.appendChild(gameTip);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    startScreen.style.display = 'block'; // 显示开始界面
    canvas.style.display = 'none'; // 隐藏游戏画布
    
    // 点击开始界面开始游戏
    startScreen.onclick = () => {
        canvas.style.display = 'block'; // 显示游戏画布
        startCountdown();
    };
}

// 初始化游戏
initGame();

// 修改游戏结束界面样式
gameOverElement.style.background = 'none';
gameOverElement.style.boxShadow = 'none';
gameOverElement.style.border = 'none';
gameOverElement.style.padding = '0';

// 隐藏最终分数显示
finalScoreElement.style.display = 'none';

// 设置页面背景色
document.body.style.backgroundColor = 'rgb(239, 240, 244)';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.minHeight = '100vh';
document.body.style.display = 'flex';
document.body.style.flexDirection = 'column';
document.body.style.alignItems = 'center';
document.body.style.justifyContent = 'center'; 