import { ExitsSection } from "./ExitsSection";
import { ConfiguratorSectionProps } from "./types";

export const ExitSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => (
  <ExitsSection inputs={inputs} setInputs={setInputs} currency={currency} />
);
