import type { NextPage } from "next";

const Terms: NextPage = () => {
  return (
    <div className="container mx-auto my-5">
      <h1 className="text-3xl font-bold mb-6">Terms of Service and Privacy Policy</h1>

      <h2 className="text-1xl font-bold mb-2">Privacy Policy</h2>
      <p className="mb-4">
        The SkyNft app does not save any personal data of its users. As a decentralized application (DApp) deployed on a
        testnet blockchain, we prioritize user privacy and data security. Since the app is currently in test/preview
        mode, no real transactions are taking place, and therefore, no personal data is collected or stored by the app.
      </p>

      <h2 className="text-1xl font-bold mb-2">Terms of Service</h2>
      <p className="mb-4">
        The SkyNft app is currently in test/preview mode and is absolutely free to use. This application is deployed on
        a testnet blockchain for testing purposes only. Users are invited to use the app for testing and feedback
        purposes without any charge. Please note, since the app operates on a testnet, any transactions or activities
        conducted will not involve real assets and will have no economic value.
      </p>

      <h2 className="text-1xl font-bold mb-2">Sanctions and Restrictions</h2>
      <p className="mb-4">
        The SkyNft app complies with all applicable laws and regulations regarding sanctions and embargoes. We do not
        provide services to individuals or entities located in countries subject to sanctions or embargoes imposed by
        the United Nations, European Union, United States. This includes, but is not limited to, individuals or entities
        in North Korea, Iran, Syria, and Russia. By using the SkyNft app, users confirm that they are not located in,
        under the control of, or a resident of any such sanctioned countries or territories.
      </p>

      <h2 className="text-1xl font-bold mb-2">Liability and Responsibility</h2>
      <p className="mb-4">
        Users of the SkyNft app assume all responsibility for their actions within the app. The app is provided on an
        &quot;as is&quot; and &quot;as available&quot; basis for testing purposes only, and by using the app, users
        agree to bear all risks associated with its use, including any reliance on the accuracy, completeness, or
        usefulness of the app. The creators of the SkyNft app disclaim all liability and responsibility arising from any
        reliance placed on the app by its users or by anyone who may be informed of its contents.
      </p>
    </div>
  );
};

export default Terms;
