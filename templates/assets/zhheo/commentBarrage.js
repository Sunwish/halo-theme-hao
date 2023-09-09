if(GLOBAL_CONFIG.htmlType!='comments') {
    var commentBarrageConfig = {
        //同时最多显示弹幕数
        maxBarrage: GLOBAL_CONFIG.source.twikoo.maxBarrage,
        //弹幕显示间隔时间ms
        barrageTime: GLOBAL_CONFIG.source.twikoo.barrageTime,
        //twikoo部署地址腾讯云的为环境ID
        twikooUrl: GLOBAL_CONFIG.source.twikoo.twikooUrl,
        //token获取见上方
        accessToken: GLOBAL_CONFIG.source.twikoo.accessToken,
        mailMd5: GLOBAL_CONFIG.source.twikoo.mailMd5,
        pageUrl: window.location.pathname,
        barrageTimer: [],
        barrageList: [],
        barrageIndex: 0,
        dom: document.querySelector('.comment-barrage'),
    }

    var commentInterval = null;
    var hoverOnCommentBarrage = false;

    $(".comment-barrage").hover(function () {
        hoverOnCommentBarrage = true;
        //console.log("热评悬浮");
    }, function () {
        hoverOnCommentBarrage = false;
        //console.log("停止悬浮");
    });

    function initCommentBarrage() {
        //console.log("开始创建热评")

        var data = JSON.stringify({
            "event": "COMMENT_GET",
            "commentBarrageConfig.accessToken": commentBarrageConfig.accessToken,
            "url": commentBarrageConfig.pageUrl
        });
        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                commentBarrageConfig.barrageList = commentLinkFilter(JSON.parse(this.responseText).data);
                commentBarrageConfig.dom.innerHTML = '';
            }
        });
        xhr.open("POST", commentBarrageConfig.twikooUrl);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(data);


        clearInterval(commentInterval);
        commentInterval = null;

        commentInterval = setInterval(() => {
            if (commentBarrageConfig.barrageList.length && !hoverOnCommentBarrage) {
                popCommentBarrage(commentBarrageConfig.barrageList[commentBarrageConfig.barrageIndex]);
                commentBarrageConfig.barrageIndex += 1;
                commentBarrageConfig.barrageIndex %= commentBarrageConfig.barrageList.length;
            }
            if ((commentBarrageConfig.barrageTimer.length > (commentBarrageConfig.barrageList.length > commentBarrageConfig.maxBarrage ? commentBarrageConfig.maxBarrage : commentBarrageConfig.barrageList.length)) && !hoverOnCommentBarrage) {
                removeCommentBarrage(commentBarrageConfig.barrageTimer.shift())
            }
        }, commentBarrageConfig.barrageTime)
    }

    function commentLinkFilter(data) {
        data.sort((a, b) => {
            return a.created - b.created;
        })
        let newData = [];
        data.forEach(item => {
            newData.push(...getCommentReplies(item));
        });
        return newData;
    }

    function getCommentReplies(item) {
        if (item.replies) {
            let replies = [item];
            item.replies.forEach(item => {
                replies.push(...getCommentReplies(item));
            })
            return replies;
        } else {
            return [];
        }
    }

    function popCommentBarrage(data) {

        let barrage = document.createElement('div');
        let width = commentBarrageConfig.dom.clientWidth;
        let height = commentBarrageConfig.dom.clientHeight;
        barrage.className = 'comment-barrage-item'
        barrage.innerHTML = `
        <div class="barrageHead">
        <a class="barrageTitle
        ${data.mailMd5 === commentBarrageConfig.mailMd5 ? "barrageBloggerTitle" : ""}" href="javascript:heo.scrollTo('post-comment')">
        ${data.mailMd5 === commentBarrageConfig.mailMd5 ? "博主" : "热评"}
        </a>
        <div class="barrageNick">${data.nick}</div>
        <img class="barrageAvatar" src="https://cravatar.cn/avatar/${data.mailMd5}"/>
        <a class="comment-barrage-close" href="javascript:heo.switchCommentBarrage()"><i class="haofont hao-icon-xmark"></i></a>
        </div>
        <a class="barrageContent" href="javascript:heo.scrollTo('${data.id}');">${data.comment}</a>
        `
        // 获取hao标签内的所有pre元素
        let haoPres = barrage.querySelectorAll(".barrageContent pre");

        // 遍历每个pre元素，将其替换为"【代码】"
        haoPres.forEach((pre) => {
            let codePlaceholder = document.createElement("span");
            codePlaceholder.innerText = "【代码】";
            pre.parentNode.replaceChild(codePlaceholder, pre);
        });

        // 获取hao标签内的所有图片元素
        let haoImages = barrage.querySelectorAll(".barrageContent img");

        // 遍历每个图片元素，将其替换为"【图片】"，但排除带有class=tk-owo-emotion的图片
        haoImages.forEach((image) => {
            if (!image.classList.contains("tk-owo-emotion")) {
                image.style.display = "none"; // 隐藏图片
                let placeholder = document.createElement("span");
                placeholder.innerText = "【图片】";
                image.parentNode.replaceChild(placeholder, image);
            }
        });
        commentBarrageConfig.barrageTimer.push(barrage);
        commentBarrageConfig.dom.append(barrage);
    }

    function removeCommentBarrage(barrage) {
        barrage.className = 'comment-barrage-item out';
        setTimeout(() => {
            commentBarrageConfig.dom.removeChild(barrage);
        }, 1000)
    }

    initCommentBarrage();

    if (localStorage.getItem('commentBarrageSwitch') !== 'false') {
        $(".comment-barrage").show();
        $(".menu-commentBarrage-text").text("关闭热评");
        document.querySelector("#consoleCommentBarrage").classList.add("on");

    } else {
        $(".comment-barrage").hide();
        $(".menu-commentBarrage-text").text("显示热评");
        document.querySelector("#consoleCommentBarrage").classList.remove("on");


    }


    document.addEventListener('pjax:send', function () {
        clearInterval(commentInterval);
    });
}