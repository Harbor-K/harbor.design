export const manifest = {
  screens: {
    scr_9wmp6z: { name: "Hero", route: "/", position: {"x":160,"y":220} },
    scr_ghhsi9: { name: "Experience", route: "/#experience", position: {"x":2960,"y":220} },
    scr_nhneog: { name: "Projects", route: "/#work", position: {"x":4360,"y":220} },
    scr_ys24nk: { name: "What I do", route: "/#what-i-do", position: {"x":1560,"y":220} },
    scr_xwpcqq: { name: "Contact", route: "/#contact", position: {"x":5760,"y":220} },
    scr_zko9v4: { name: "Trust Bank — case study", route: "/#/trust-bank", position: {"x":160,"y":2200} },
    scr_about1: { name: "About", route: "/#/about", position: {"x":1880,"y":2200} },
  },
  sections: {
    sec_vxw9at: { name: "Portfolio landing", x: 0, y: 0, width: 7120, height: 1180 },
    sec_2ojj2d: { name: "Case studies", x: 0, y: 1980, width: 1520, height: 1180 },
    sec_about1: { name: "About", x: 1720, y: 1980, width: 1520, height: 1180 },
  },
  layers: [
    { kind: "section", id: "sec_vxw9at", children: [
      { kind: "screen", id: "scr_9wmp6z" },
      { kind: "screen", id: "scr_ys24nk" },
      { kind: "screen", id: "scr_ghhsi9" },
      { kind: "screen", id: "scr_nhneog" },
      { kind: "screen", id: "scr_xwpcqq" },
    ] },
    { kind: "section", id: "sec_2ojj2d", children: [
      { kind: "screen", id: "scr_zko9v4" },
    ] },
    { kind: "section", id: "sec_about1", children: [
      { kind: "screen", id: "scr_about1" },
    ] },
  ],
}
