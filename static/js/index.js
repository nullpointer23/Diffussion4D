window.HELP_IMPROVE_VIDEOJS = false;

var INTERP_BASE = "./static/interpolation/stacked";
var NUM_INTERP_FRAMES = 240;

var interp_images = [];
function preloadInterpolationImages() {
    for (var i = 0; i < NUM_INTERP_FRAMES; i++) {
        var path = INTERP_BASE + "/" + String(i).padStart(6, "0") + ".jpg";
        interp_images[i] = new Image();
        interp_images[i].src = path;
    }
}

function setInterpolationImage(i) {
    var image = interp_images[i];
    image.ondragstart = function () {
        return false;
    };
    image.oncontextmenu = function () {
        return false;
    };
    $("#interpolation-image-wrapper").empty().append(image);
}

$(document).ready(function () {
    // Check for click events on the navbar burger icon
    $(".navbar-burger").click(function () {
        // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
        $(".navbar-burger").toggleClass("is-active");
        $(".navbar-menu").toggleClass("is-active");
    });

    var options = {
        slidesToScroll: 1,
        slidesToShow: 3,
        loop: true,
        infinite: true,
        autoplay: false,
        autoplaySpeed: 3000,
    };

    // Initialize all div with carousel class
    var carousels = bulmaCarousel.attach(".carousel", options);

    // Loop on each carousel initialized
    for (var i = 0; i < carousels.length; i++) {
        // Add listener to  event
        carousels[i].on("before:show", (state) => {
            console.log(state);
        });
    }

    // Access to bulmaCarousel instance of an element
    var element = document.querySelector("#my-element");
    if (element && element.bulmaCarousel) {
        // bulmaCarousel instance is available as element.bulmaCarousel
        element.bulmaCarousel.on("before-show", function (state) {
            console.log(state);
        });
    }

    /*var player = document.getElementById('interpolation-video');
    player.addEventListener('loadedmetadata', function() {
      $('#interpolation-slider').on('input', function(event) {
        console.log(this.value, player.duration);
        player.currentTime = player.duration / 100 * this.value;
      })
    }, false);*/
    preloadInterpolationImages();

    $("#interpolation-slider").on("input", function (event) {
        setInterpolationImage(this.value);
    });
    setInterpolationImage(0);
    $("#interpolation-slider").prop("max", NUM_INTERP_FRAMES - 1);

    $(".results-section").each(function () {
        var section = this;
        var panel = section.querySelector(".results-video-panel");
        var activeVideo = section.querySelector(
            ".results-video-panel .results-video",
        );
        if (!panel || !activeVideo) {
            return;
        }

        var getSourceEl = function (videoEl) {
            var sourceEl = videoEl.querySelector("source");
            if (!sourceEl) {
                sourceEl = document.createElement("source");
                sourceEl.type = "video/mp4";
                videoEl.appendChild(sourceEl);
            }
            return sourceEl;
        };

        var getSourceSrc = function (videoEl) {
            return (
                videoEl.getAttribute("src") ||
                videoEl.currentSrc ||
                getSourceEl(videoEl).getAttribute("src") ||
                ""
            );
        };

        var setVideoSource = function (videoEl, src) {
            var sourceEl = getSourceEl(videoEl);
            sourceEl.setAttribute("src", src);
            videoEl.setAttribute("src", src);
        };

        $(section)
            .find(".results-tabs a[data-video]")
            .on("click", function (event) {
                event.preventDefault();

                var nextSource = this.dataset.video;
                var currentSource = getSourceSrc(activeVideo);
                if (!nextSource || nextSource === currentSource) {
                    return;
                }

                $(this).closest("ul").find("li").removeClass("is-active");
                $(this).parent().addClass("is-active");

                // Guard against rapid tab changes: only the latest click can swap videos.
                var nextToken = Number(section.dataset.switchToken || 0) + 1;
                section.dataset.switchToken = String(nextToken);

                if (section._switchFallbackTimer) {
                    clearTimeout(section._switchFallbackTimer);
                }

                var nextVideo = activeVideo.cloneNode(true);
                nextVideo.classList.add("is-hidden");
                setVideoSource(nextVideo, nextSource);
                panel.appendChild(nextVideo);
                nextVideo.load();

                var didSwap = false;

                var swapIfCurrent = function () {
                    if (didSwap) {
                        return;
                    }
                    if (String(nextToken) !== section.dataset.switchToken) {
                        nextVideo.remove();
                        return;
                    }
                    didSwap = true;

                    if (section._switchFallbackTimer) {
                        clearTimeout(section._switchFallbackTimer);
                        section._switchFallbackTimer = null;
                    }

                    var playPromise = nextVideo.play();
                    if (
                        playPromise &&
                        typeof playPromise.catch === "function"
                    ) {
                        playPromise.catch(function () {
                            // Ignore autoplay restrictions; controls allow manual play.
                        });
                    }

                    activeVideo.pause();
                    activeVideo.remove();
                    nextVideo.classList.remove("is-hidden");
                    activeVideo = nextVideo;
                };

                var onCanPlay = function () {
                    swapIfCurrent();
                };

                nextVideo.addEventListener("canplay", onCanPlay, {
                    once: true,
                });

                // Fallback in case the ready event is delayed on some browsers.
                section._switchFallbackTimer = setTimeout(function () {
                    if (nextVideo.readyState >= 2) {
                        swapIfCurrent();
                    }
                }, 1200);
            });
    });

    bulmaSlider.attach();
});
