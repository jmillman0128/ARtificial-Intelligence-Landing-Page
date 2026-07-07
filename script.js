
document.addEventListener('DOMContentLoaded', () => {
    console.log("Script loaded");  
    // 1. Parallax Effect for Hero Background
    window.addEventListener('scroll', () => {
        const hero = document.querySelector('.hero');
        let offset = window.pageYOffset;
        hero.style.backgroundPositionY = offset * 0.7 + 'px';
    });

    // 2. Reveal animations on scroll
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                if (!entry.target.classList.contains('cards')){
                    entry.target.style.transform = 'translateY(0)';  
                }
            }
        });
    }, observerOptions);

    // Apply animation style to feature cards and text
    const animateElements = document.querySelectorAll('.cards, .feature-card, .text-block');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        if (el.classList.contains('cards')){
            el.style.transition = 'all 1s ease-out';
        }
        else{
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        }
        observer.observe(el);
    });
    gsap.registerPlugin(ScrollTrigger);

    gsap.to(".cards li", {opacity: 1,delay: 0.1}) // gentle fade in

    let iteration = 0; // gets iterated when we scroll all the way to the end or start and wraps around - allows us to smoothly continue the playhead scrubbing in the correct direction.

    const spacing = 0.1,    // spacing of the cards (stagger)
        snap = gsap.utils.snap(spacing), // we'll use this to snap the playhead on the seamlessLoop
        cards = gsap.utils.toArray('.cards li'),
        seamlessLoop = buildSeamlessLoop(cards, spacing),
        scrub = gsap.to(seamlessLoop, { // we reuse this tween to smoothly scrub the playhead on the seamlessLoop
            totalTime: 0,
            duration: 0.5,
            ease: "power3",
            paused: true,
        }),
        trigger = ScrollTrigger.create({
            start: 0,
            scroller: ".gallery",
            onUpdate(self) {
                if (self.progress > 0.59 && !self.wrapping) {
                    wrapForward(self);
                } else if (self.progress < 1e-9 && self.direction < 0 && !self.wrapping) {
                    wrapBackward(self);
                } else {
            scrub.vars.totalTime = snap((iteration + self.progress) * seamlessLoop.duration());
                    scrub.invalidate().restart(); // to improve performance, we just invalidate and restart the same tween. No need for overwrites or creating a new tween on each update.
                    self.wrapping = false;
            }},
            end: "+=3000",
        });

    function wrapForward(trigger) { // when the ScrollTrigger reaches the end, loop back to the beginning seamlessly
        iteration++;
        trigger.wrapping = true;
        trigger.scroll(trigger.start + 1);
    }

    function wrapBackward(trigger) { // when the ScrollTrigger reaches the start again (in reverse), loop back to the end seamlessly
        iteration--;
        if (iteration < 0) { // to keep the playhead from stopping at the beginning, we jump ahead 10 iterations
            iteration = 9;
            seamlessLoop.totalTime(seamlessLoop.totalTime() + seamlessLoop.duration() * 10);
        scrub.pause(); // otherwise it may update the totalTime right before the trigger updates, making the starting value different than what we just set above. 
        }
        trigger.wrapping = true;
        trigger.scroll(trigger.end - 1);
    }

    function scrubTo(totalTime) { // moves the scroll position to the place that corresponds to the totalTime value of the seamlessLoop, and wraps if necessary.
        console.log("envoked");
        let progress = (totalTime - seamlessLoop.duration() * iteration) / seamlessLoop.duration();
        console.log(progress)
        if (progress > 1) {
            wrapForward(trigger);
        } else if (progress < 0) {
            wrapBackward(trigger);
        } else {
            trigger.scroll(trigger.start + progress * (trigger.end - trigger.start));
        }
    }

    document.querySelector(".next").addEventListener("click", () => scrubTo(scrub.vars.totalTime + spacing));
    document.querySelector(".prev").addEventListener("click", () => scrubTo(scrub.vars.totalTime - spacing));


    function buildSeamlessLoop(items, spacing) {
        let overlap = Math.ceil(1 / spacing), // number of EXTRA animations on either side of the start/end to accommodate the seamless looping
            startTime = items.length * spacing + 0.5, // the time on the rawSequence at which we'll start the seamless loop
            loopTime = (items.length + overlap) * spacing + 1, // the spot at the end where we loop back to the startTime 
            rawSequence = gsap.timeline({paused: true}), // this is where all the "real" animations live
            seamlessLoop = gsap.timeline({ // this merely scrubs the playhead of the rawSequence so that it appears to seamlessly loop
                paused: true,
                repeat: -1, // to accommodate infinite scrolling/looping
                onRepeat() { // works around a super rare edge case bug that's fixed GSAP 3.6.1
                    this._time === this._dur && (this._tTime += this._dur - 0.01);
                }
            }),
            l = items.length + overlap * 2,
            time = 0,
            i, index, item;

        // set initial state of items
        gsap.set(items, {xPercent: 400, opacity: 0,	scale: 0});

        // now loop through and create all the animations in a staggered fashion. Remember, we must create EXTRA animations at the end to accommodate the seamless looping.
        for (i = 0; i < l; i++) {
            index = i % items.length;
            item = items[index];
            time = i * spacing;
            rawSequence.fromTo(item, {scale: 0, opacity: 0}, {scale: 1, opacity: 1, zIndex: 100, duration: 0.5, yoyo: true, repeat: 1, ease: "power1.in", immediateRender: false}, time)
                    .fromTo(item, {xPercent: 400}, {xPercent: -400, duration: 1, ease: "none", immediateRender: false}, time);
            i <= items.length && seamlessLoop.add("label" + i, time); // we don't really need these, but if you wanted to jump to key spots using labels, here ya go.
        }
        
        // here's where we set up the scrubbing of the playhead to make it appear seamless. 
        rawSequence.time(startTime);
        seamlessLoop.to(rawSequence, {
            time: loopTime,
            duration: loopTime - startTime,
            ease: "none"
        }).fromTo(rawSequence, {time: overlap * spacing + 1}, {
            time: startTime,
            duration: startTime - (overlap * spacing + 1),
            immediateRender: false,
            ease: "none"
        });
        return seamlessLoop;
    }

    // =========================================================================
    //  Activation Form
    //  Replace RELAY_URL below with your deployed relay server URL.
    // =========================================================================
    const RELAY_URL = 'https://your-relay.example.com';

    const activationForm     = document.getElementById('activationForm');
    const sessionCodeInput   = document.getElementById('sessionCode');
    const apiKeyInput        = document.getElementById('apiKey');
    const toggleKeyBtn       = document.getElementById('toggleKey');
    const activateBtn        = document.getElementById('activateBtn');
    const activateBtnLabel   = document.getElementById('activateBtnLabel');
    const activateBtnSpinner = document.getElementById('activateBtnSpinner');
    const activateStatus     = document.getElementById('activateStatus');

    if (toggleKeyBtn) {
        toggleKeyBtn.addEventListener('click', () => {
            const visible = apiKeyInput.type === 'text';
            apiKeyInput.type = visible ? 'password' : 'text';
            toggleKeyBtn.textContent = visible ? 'Show' : 'Hide';
        });
    }

    if (sessionCodeInput) {
        sessionCodeInput.addEventListener('input', () => {
            sessionCodeInput.value = sessionCodeInput.value.replace(/\D/g, '').slice(0, 6);
        });
    }

    if (activationForm) {
        activationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearActivateStatus();

            const code   = sessionCodeInput.value.trim();
            const apiKey = apiKeyInput.value.trim();

            if (!/^\d{6}$/.test(code)) {
                showActivateStatus('Please enter the 6-digit code shown in your headset.', 'error');
                sessionCodeInput.focus();
                return;
            }
            if (!apiKey || apiKey.length < 10) {
                showActivateStatus('Please enter a valid API key.', 'error');
                apiKeyInput.focus();
                return;
            }

            setActivateLoading(true);
            try {
                const response = await fetch(`${RELAY_URL}/api/submit-key`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ code, apiKey }),
                });

                let data;
                try { data = await response.json(); } catch { data = {}; }

                if (response.ok) {
                    showActivateStatus(
                        'Key sent! Put on your headset \u2014 the experience should start in a few seconds.',
                        'success'
                    );
                    activationForm.reset();
                } else if (response.status === 429) {
                    showActivateStatus('Too many attempts. Please wait a moment and try again.', 'error');
                } else {
                    showActivateStatus(data.error || 'Something went wrong. Please try again.', 'error');
                }
            } catch {
                showActivateStatus(
                    'Could not reach the activation server. Check your internet connection and try again.',
                    'error'
                );
            } finally {
                setActivateLoading(false);
            }
        });
    }

    function setActivateLoading(loading) {
        activateBtn.disabled = loading;
        activateBtnLabel.classList.toggle('hidden', loading);
        activateBtnSpinner.classList.toggle('hidden', !loading);
    }

    function showActivateStatus(message, type) {
        activateStatus.textContent = message;
        activateStatus.className   = `activate-status ${type}`;
    }

    function clearActivateStatus() {
        activateStatus.textContent = '';
        activateStatus.className   = 'activate-status hidden';
    }

});