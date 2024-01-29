import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";
import { useState } from "react";
import Modal from "react-modal";
import { XMarkIcon } from "@heroicons/react/20/solid";

const Whitepaper: NextPage = () => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalImage, setModalImage] = useState("");

  const openModal = (imgSrc: string) => {
    setModalImage(imgSrc);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  return (
    <>
      <MetaHeader />
      <div className="container mx-auto my-5">
        <h2 className="text-2xl font-bold mb-2">Introduction</h2>
        <p className="mb-4">
          This project integrates astronomical visualization with blockchain technology to create a unique NFT platform.
          It is designed for NFT enthusiasts and the general public, allowing users to capture specific astronomical
          scenes based on geographic coordinates and time. This capability is particularly useful for commemorating
          historical events or personal memories in a digital format.
        </p>
        <div className="carousel carousel-center">
          <div className="carousel-item">
            <img
              src="/tour/your-tokens.png"
              alt="List of tokens"
              className="cursor-pointer rounded-box"
              onClick={() => openModal("/tour/your-tokens.png")}
            />
          </div>
          <div className="carousel-item">
            <img
              src="/tour/token1.png"
              alt="Single token"
              className="cursor-pointer"
              onClick={() => openModal("/tour/token1.png")}
            />
          </div>
          <div className="carousel-item">
            <img
              src="/tour/token1-polaris.png"
              alt="Single token"
              className="cursor-pointer"
              onClick={() => openModal("/tour/token1-polaris.png")}
            />
          </div>
          <div className="carousel-item">
            <img
              src="/tour/mint-ui.png"
              alt="Minting UI"
              className="cursor-pointer"
              onClick={() => openModal("/tour/mint-ui.png")}
            />
          </div>
          <div className="carousel-item">
            <img
              src="/tour/wallet-mint.png"
              alt="Minting confirmation"
              className="cursor-pointer"
              onClick={() => openModal("/tour/wallet-mint.png")}
            />
          </div>
          <div className="carousel-item">
            <img
              src="/tour/wallet-nft.png"
              alt="Imported NFTs"
              className="cursor-pointer"
              onClick={() => openModal("/tour/wallet-nft.png")}
            />
          </div>
        </div>
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          contentLabel="Image Modal"
          className="modal-content"
          overlayClassName="modal-overlay"
        >
          <a href="#" onClick={closeModal} className="btn btn-circle modal-close">
            <XMarkIcon />
          </a>
          <img src={modalImage} className="modal-image" />
        </Modal>{" "}
        <h2 className="text-2xl font-bold mb-2">Project Overview</h2>
        <p className="mb-4">
          NFTs represent accurate astronomical data for specified times and locations. The user interface of our dApp
          enables easy viewing and minting of these tokens. These NFTs adhere to the ERC721 standard, allowing for their
          transfer and trade using common web3 wallets. The NFT is presented as an interactive SVG, which is fully
          generated on-chain.
        </p>
        <h2 className="text-2xl font-bold mb-2">Technical Aspects</h2>
        <p className="mb-4">
          The current setup, featuring the Polygon Mumbai testnet, Vercel hosting, and a Python/Skyfield backend, is
          tailored for the prototype phase. The final selection of technologies, including the blockchain platform, will
          be determined based on efficiency and scalability considerations.
        </p>
        <p className="mb-4">
          Minting an NFT currently requires around 1.3M gas. This figure is under continuous review for optimization to
          reduce costs. On the Ethereum mainnet, this equates to roughly $45 (with ETH at $2300), and under $1 on the
          Polygon mainnet.
        </p>
        <h2 className="text-2xl font-bold mb-2">Market Position and Use Case</h2>
        <p className="mb-4">
          The project introduces a novel approach in the NFT sector, combining astronomical data with blockchain. The
          primary users are collectors and enthusiasts, with potential applications in blockchain education.
        </p>
        <h2 className="text-2xl font-bold mb-2">Future Developments</h2>
        <p className="mb-4">
          A key area of future development is the personalization of NFTs. Given that these are generated as SVGs, users
          will have extensive customization options, including color changes and text additions. Additionally, we plan
          to incorporate the visualization of planets into the NFTs, enhancing their educational and visual appeal.
          Other areas of development include legal compliance, UI/UX enhancements, and technical optimizations to
          improve the user experience and efficiency of the platform.
        </p>
        <h2 className="text-2xl font-bold mb-2">Challenges and Solutions</h2>
        <p className="mb-4">
          A major challenge has been optimizing the smart contract for gas efficiency while maintaining the detail of
          star map data. Our efforts are focused on finding a balance between cost and quality. The creation of
          efficient yet detailed SVGs has been a complex task, but one that we have successfully addressed.
        </p>
        <h2 className="text-2xl font-bold mb-2">Conclusion</h2>
        <p className="mb-4">
          This project is an intersection of astronomy and blockchain technology, offering a distinctive way to
          digitally capture and own representations of the night sky. We are committed to continuous improvement,
          focusing on technical enhancements and user experience. We invite those interested in this technology to
          explore the potential of our platform.
        </p>
      </div>
    </>
  );
};

export default Whitepaper;
