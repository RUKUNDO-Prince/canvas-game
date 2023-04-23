const canvas = document.querySelector('canvas');
const scoreEl = document.querySelector('#scoreEl');
const startGameBtn = document.querySelector('#startGameBtn');
const modalEl = document.querySelector('#modalEl');
const bigScoreEl = document.querySelector('#bigScoreEl');
const c = canvas.getContext('2d');     // HERE C MEANS CONTEXT

canvas.width = innerWidth;
canvas.height = innerHeight;

// CREATING A PLAYER
class Player {
    constructor (x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw(){
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
}

// CREATING A PROJECTILE
class Projectile {
    constructor (x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw(){
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update(){
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

// CREATING AN ENEMY
class Enemy {
    constructor (x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw(){
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update(){
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

// CREATE A PARTICLE CLASS -- SO THAT THE ENEMY SHRINKS INTO PARTICLES AFTER BEING HIT
const friction = 0.97;
class Particle {
    constructor (x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw(){
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }

    update(){
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01;
    }
}

// TO CENTER THE PLAYER
const x = canvas.width / 2;
const y = canvas.height /2;

let player = new Player(x, y, 20, 'white');
// player.draw();

// THE ARRAYS
let projectiles = [];
let enemies = [];
let particles = [];

function init() {
    player = new Player(x, y, 20, 'white');
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreEl.innerHTML = score;
    bigScoreEl.innerHTML = score;
}

function spawnEnemies(){
    setInterval(() => {
        const radius = Math.random() * (30 - 5) + 5;
        let x;
        let y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;  
        }else{
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius; 
        }
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;

        const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }

        enemies.push(new Enemy(x, y, radius, color, velocity));
    }, 1000);
}


let animationId;
let score = 0;

// THE ANIMATE LOOPS
function animate(){
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0, 0, 0, 0.1)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        }else{
            particle.update();
        }
    });
    projectiles.forEach((projectile, index) => {
        projectile.update();

        if (projectile.x + projectile.radius < 0 || projectile.x - projectile.radius > canvas.width || projectile.y + projectile.radius < 0 || projectile.y - projectile.radius > canvas.height) {
            setTimeout(() => {
                projectile.splice(index, 1);
            }, 0);
        }
    });
    enemies.forEach((enemy, index) => {
        enemy.update();
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

        // END GAME
        if (dist - enemy.radius - player.radius < 1){
            cancelAnimationFrame(animationId); 
            modalEl.style.display = 'flex';
            bigScoreEl.innerHTML = score;
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

            // WHEN PROJECTILES TOUCH THE ENEMY
            if (dist - enemy.radius - projectile.radius < 1) {
                // CREATE PARTICLE EXPLOSIONS
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, { x : (Math.random() - 0.5) * (Math.random() * 8), y : (Math.random() - 0.5) * (Math.random() * 8) }));
                }
                if (enemy.radius - 10 > 5) {
                    // INCREASE THE SCORE
                    score += 100;
                    scoreEl.innerHTML = score;

                    // enemy.radius -= 10;
                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    });
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                }else{
                    // REMOVE FROM THE SCENE ALTOGETHER
                    score += 250;
                    scoreEl.innerHTML = score;

                    setTimeout(() => {
                        enemies.splice(index, 1);
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                }  
            }
        });
    });
}

addEventListener('click', (event) => {
    const angle = Math.atan2(event.clientY - y, event.clientX - x);
    const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    }
    projectiles.push(new Projectile(x, y, 5, 'white', velocity));
});
startGameBtn.addEventListener('click', () => {
    init();
    modalEl.style.display = 'none';
    animate();
    spawnEnemies();
});