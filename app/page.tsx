import EthOrderBookHorizontal from "@/components/EthOrderBookHorizontal";
import NavigationWheel from "@/components/NavigationWheel";

export default function Home() {
  return (
    <>
      <div className="-mt-5">
        <EthOrderBookHorizontal />
      </div>
      <NavigationWheel />
    </>
  );
}
