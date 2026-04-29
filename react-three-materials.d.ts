import "@react-three/fiber";

declare module "@react-three/fiber" {
  interface ThreeElements {
    voiceOrbMaterial: any;
    fluidMaterial: any;
  }
}
