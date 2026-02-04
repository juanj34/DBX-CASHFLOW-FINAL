import { RentSection } from "./RentSection";
import { ConfiguratorSectionProps } from "./types";

export const RentalSection = ({ inputs, setInputs, currency }: ConfiguratorSectionProps) => {
  return <RentSection inputs={inputs} setInputs={setInputs} currency={currency} />;
};
