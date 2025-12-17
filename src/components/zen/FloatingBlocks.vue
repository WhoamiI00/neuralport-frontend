<template>
    <ul class="floating-blocks">
        <li v-for="i in 20" :key="i"></li>
    </ul>
</template>

<script setup lang="ts">
// Floating blocks background component
// Renders animated floating blocks that adapt to light/dark mode
</script>

<style lang="scss" scoped>
.floating-blocks {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    pointer-events: none;

    li {
        position: absolute;
        display: block;
        width: 30px;
        height: 30px;
        background: var(--zen-block-bg);
        animation: floatUp 25s linear infinite;
        bottom: -150px;
        border-radius: 0;
        border: 2px solid var(--zen-block-border);
        transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }

    // Block 1 - Large glassmorphism
    li:nth-child(1) {
        left: 25%;
        width: 120px;
        height: 120px;
        animation-delay: 0s;
        background: linear-gradient(135deg, rgba(var(--zen-rgb-teal, 168, 237, 234), 0.5), rgba(var(--zen-rgb-peach, 254, 214, 227), 0.4));
        backdrop-filter: blur(8px);
        border-color: var(--zen-block-border);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 0 20px var(--zen-block-glow);
    }

    // Block 2 - Peach solid
    li:nth-child(2) {
        left: 10%;
        width: 35px;
        height: 35px;
        animation-delay: 2s;
        animation-duration: 12s;
        background: rgba(var(--zen-rgb-peach, 254, 214, 227), 0.6);
        border-color: rgba(var(--zen-rgb-peach, 254, 214, 227), 0.7);
        box-shadow: 0 0 25px rgba(var(--zen-rgb-peach, 254, 214, 227), 0.5);
    }

    // Block 3 - Hollow outline
    li:nth-child(3) {
        left: 70%;
        width: 40px;
        height: 40px;
        animation-delay: 4s;
        background: rgba(255, 255, 255, 0.1);
        border: 3px solid var(--zen-block-border);
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
    }

    // Block 4 - Gradient glow
    li:nth-child(4) {
        left: 40%;
        width: 90px;
        height: 90px;
        animation-delay: 0s;
        animation-duration: 18s;
        background: linear-gradient(45deg, rgba(var(--zen-rgb-teal, 168, 237, 234), 0.5), rgba(var(--zen-rgb-cream, 245, 230, 202), 0.4));
        border-color: rgba(var(--zen-rgb-teal, 168, 237, 234), 0.5);
        box-shadow: 0 0 40px var(--zen-block-glow);
    }

    // Block 5 - Dotted border
    li:nth-child(5) {
        left: 65%;
        width: 35px;
        height: 35px;
        animation-delay: 0s;
        background: var(--zen-block-bg);
        border: 3px dashed var(--zen-block-border);
    }

    // Block 6 - Radial gradient
    li:nth-child(6) {
        left: 85%;
        width: 50px;
        height: 50px;
        animation-delay: 0s;
        background: radial-gradient(circle, rgba(var(--zen-rgb-peach, 254, 214, 227), 0.6) 0%, rgba(var(--zen-rgb-peach, 254, 214, 227), 0.2) 70%);
        border-color: rgba(var(--zen-rgb-peach, 254, 214, 227), 0.5);
        box-shadow: 0 0 20px rgba(var(--zen-rgb-peach, 254, 214, 227), 0.3);
    }

    // Block 7 - Small glowing dot
    li:nth-child(7) {
        left: 15%;
        width: 25px;
        height: 25px;
        animation-delay: 0s;
        background: rgba(var(--zen-rgb-teal, 168, 237, 234), 0.7);
        border-color: rgba(var(--zen-rgb-teal, 168, 237, 234), 0.8);
        box-shadow: 0 0 30px var(--zen-block-glow), 0 0 60px rgba(var(--zen-rgb-teal, 168, 237, 234), 0.3);
    }

    // Block 8 - Double border
    li:nth-child(8) {
        left: 50%;
        width: 70px;
        height: 70px;
        animation-delay: 0s;
        animation-duration: 16s;
        background: var(--zen-block-bg);
        border: 4px double var(--zen-block-border);
        backdrop-filter: blur(4px);
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
    }

    // Block 9 - Peach glow
    li:nth-child(9) {
        left: 5%;
        width: 65px;
        height: 65px;
        animation-delay: 2s;
        animation-duration: 22s;
        background: linear-gradient(180deg, rgba(var(--zen-rgb-peach, 254, 214, 227), 0.5), rgba(var(--zen-rgb-cream, 245, 230, 202), 0.4));
        border-color: rgba(var(--zen-rgb-peach, 254, 214, 227), 0.5);
        box-shadow: 0 4px 30px rgba(var(--zen-rgb-peach, 254, 214, 227), 0.4);
    }

    // Block 10 - Inner shadow
    li:nth-child(10) {
        left: 90%;
        width: 55px;
        height: 55px;
        animation-delay: 0s;
        background: var(--zen-block-bg);
        border-color: var(--zen-block-border);
        box-shadow: inset 0 0 25px rgba(255, 255, 255, 0.3), 0 0 25px var(--zen-block-glow);
    }

    // Block 11 - Striped
    li:nth-child(11) {
        left: 3%;
        width: 40px;
        height: 40px;
        animation-delay: 1s;
        animation-duration: 14s;
        background: repeating-linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.4),
            rgba(255, 255, 255, 0.4) 4px,
            rgba(255, 255, 255, 0.1) 4px,
            rgba(255, 255, 255, 0.1) 8px
        );
        border-color: var(--zen-block-border);
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
    }

    // Block 12 - Large glassmorphism
    li:nth-child(12) {
        left: 33%;
        width: 85px;
        height: 85px;
        animation-delay: 5s;
        animation-duration: 20s;
        background: var(--zen-block-bg);
        backdrop-filter: blur(10px);
        border-color: var(--zen-block-border);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 0 20px rgba(255, 255, 255, 0.15);
    }

    // Block 13 - Cream dot
    li:nth-child(13) {
        left: 55%;
        width: 30px;
        height: 30px;
        animation-delay: 3s;
        animation-duration: 11s;
        background: rgba(var(--zen-rgb-cream, 245, 230, 202), 0.7);
        border-color: rgba(var(--zen-rgb-cream, 245, 230, 202), 0.8);
        box-shadow: 0 0 25px rgba(var(--zen-rgb-cream, 245, 230, 202), 0.5);
    }

    // Block 14 - Large outline with glow
    li:nth-child(14) {
        left: 78%;
        width: 100px;
        height: 100px;
        animation-delay: 7s;
        animation-duration: 28s;
        background: rgba(var(--zen-rgb-teal, 168, 237, 234), 0.1);
        border: 3px solid rgba(var(--zen-rgb-teal, 168, 237, 234), 0.5);
        box-shadow: 0 0 35px var(--zen-block-glow), inset 0 0 30px rgba(var(--zen-rgb-teal, 168, 237, 234), 0.1);
    }

    // Block 15 - Conic gradient
    li:nth-child(15) {
        left: 22%;
        width: 45px;
        height: 45px;
        animation-delay: 0.5s;
        animation-duration: 15s;
        background: conic-gradient(from 0deg, rgba(var(--zen-rgb-teal, 168, 237, 234), 0.5), rgba(var(--zen-rgb-peach, 254, 214, 227), 0.5), rgba(var(--zen-rgb-cream, 245, 230, 202), 0.5), rgba(var(--zen-rgb-teal, 168, 237, 234), 0.5));
        border-color: var(--zen-block-border);
        box-shadow: 0 0 20px var(--zen-block-glow);
    }

    // Block 16 - Frosted glass
    li:nth-child(16) {
        left: 60%;
        width: 60px;
        height: 60px;
        animation-delay: 6s;
        animation-duration: 19s;
        background: var(--zen-block-bg);
        backdrop-filter: blur(6px);
        border-color: var(--zen-block-border);
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
    }

    // Block 17 - Peach outline
    li:nth-child(17) {
        left: 45%;
        width: 28px;
        height: 28px;
        animation-delay: 8s;
        animation-duration: 10s;
        background: rgba(var(--zen-rgb-peach, 254, 214, 227), 0.2);
        border: 3px solid rgba(var(--zen-rgb-peach, 254, 214, 227), 0.6);
        box-shadow: 0 0 15px rgba(var(--zen-rgb-peach, 254, 214, 227), 0.3);
    }

    // Block 18 - Large teal glow
    li:nth-child(18) {
        left: 92%;
        width: 80px;
        height: 80px;
        animation-delay: 4s;
        animation-duration: 24s;
        background: radial-gradient(circle, rgba(var(--zen-rgb-teal, 168, 237, 234), 0.5) 0%, rgba(var(--zen-rgb-teal, 168, 237, 234), 0.1) 70%);
        border-color: rgba(var(--zen-rgb-teal, 168, 237, 234), 0.4);
        box-shadow: 0 0 50px var(--zen-block-glow);
    }

    // Block 19 - Cross-hatched
    li:nth-child(19) {
        left: 8%;
        width: 55px;
        height: 55px;
        animation-delay: 9s;
        animation-duration: 17s;
        background: 
            repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.3) 3px, transparent 3px, transparent 8px),
            repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.3) 3px, transparent 3px, transparent 8px),
            var(--zen-block-bg);
        border-color: var(--zen-block-border);
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
    }

    // Block 20 - Largest gradient
    li:nth-child(20) {
        left: 52%;
        width: 110px;
        height: 110px;
        animation-delay: 3s;
        animation-duration: 30s;
        background: linear-gradient(135deg, rgba(var(--zen-rgb-teal, 168, 237, 234), 0.4) 0%, rgba(var(--zen-rgb-peach, 254, 214, 227), 0.3) 50%, rgba(var(--zen-rgb-cream, 245, 230, 202), 0.3) 100%);
        backdrop-filter: blur(12px);
        border-color: var(--zen-block-border);
        box-shadow: 0 10px 50px rgba(0, 0, 0, 0.1), 0 0 30px var(--zen-block-glow);
    }
}

@keyframes floatUp {
    0% {
        transform: translateY(0) rotate(0deg);
        opacity: 1;
        border-radius: 0;
    }
    100% {
        transform: translateY(-1200px) rotate(720deg);
        opacity: 0;
        border-radius: 50%;
    }
}

// Hide some blocks on mobile for performance
@media (max-width: 768px) {
    .floating-blocks {
        li:nth-child(2),
        li:nth-child(3),
        li:nth-child(5),
        li:nth-child(6),
        li:nth-child(7),
        li:nth-child(10),
        li:nth-child(14),
        li:nth-child(16),
        li:nth-child(18) {
            display: none;
        }
    }
}
</style>
