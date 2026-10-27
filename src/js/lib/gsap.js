// GSAP et ses plugins sont enregistrés une seule fois, ici.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, InertiaPlugin, DrawSVGPlugin);

export { gsap, ScrollTrigger };
