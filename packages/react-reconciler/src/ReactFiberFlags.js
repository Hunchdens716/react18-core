export const NoFlags = 0b00000000000000000000000000000000;
export const Placement = 0b00000000000000000000000000000010;
export const Update = 0b00000000000000000000000000000100;
export const ChildDeletion = 0b00000000000000000000000000001000;
export const MutationMask = Placement | Update;
export const Passive = 0b0000000000000000000000010000000
export const LayoutMask = Update;