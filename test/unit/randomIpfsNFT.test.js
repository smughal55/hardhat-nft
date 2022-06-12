const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RandomIpfsNft Unit Tests", function () {
          let randomIpfsNft, vrfCoordinatorV2Mock, mintFee, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["mocks", "randomipfs"])
              randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer)
              mintFee = await randomIpfsNft.getMintFee()
          })

          describe("constructor", function () {
              it("initialises the randomIpfsNft correctly", async function () {
                  // Ideally we make our tests have just 1 assert per "it"
                  const doggieUri = await randomIpfsNft.getDogTokenUris(0)
                  assert.equal(doggieUri, "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo")
                  const randomIpfsNftMintFee = await randomIpfsNft.getMintFee()
                  assert.equal(mintFee, randomIpfsNftMintFee.toString())
              })
          })

          describe("requestNft", function () {
              it("reverts when you don't pay enough", async function () {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                      "RandomIpfsNft__NeedMoreETHSent"
                  )
              })

              it("records NFT minters", async function () {
                  await randomIpfsNft.requestNft({ value: mintFee })
                  const nftMinterFromContract = await randomIpfsNft.s_requestIdToSender(1)
                  assert.equal(nftMinterFromContract, deployer)
              })

              it("emits an event on requesting an NFT", async function () {
                  await expect(randomIpfsNft.requestNft({ value: mintFee })).to.emit(
                      randomIpfsNft,
                      "NftRequested"
                  )
              })
          })

          describe("fulfillRandomWords", function () {
              it("mints the dog NFT and updates the token counter", async function () {
                  // requestNft
                  // kicks off fulfillRandomness (mock being the Chainlink VRF)
                  // We will have to wait for the fulfillRandomness to be called
                  await new Promise(async (resolve, reject) => {
                      randomIpfsNft.once("NftMinted", async () => {
                          // this promise is setup prior the fulfillRandomWords is executed to be able to start listening for the event
                          console.log("NftMinted event fired!")
                          try {
                              // Now lets get the ending values...
                              const tokenCounter = await randomIpfsNft.getTokenCounter()
                              assert.equal(tokenCounter.toString(), 1)
                              const doggieUri = await randomIpfsNft.getDogTokenUris(0)
                              assert.equal(
                                  doggieUri,
                                  "ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo"
                              )
                          } catch (e) {
                              reject(e)
                          }
                          resolve()
                      })
                      // Setting up the listener
                      // below, we will fire the event, and the listener will pick it up, and resolve
                      const tx = await randomIpfsNft.requestNft({ value: mintFee })
                      const txReceipt = await tx.wait(1)
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[1].args.requestId,
                          randomIpfsNft.address
                      )
                  })
              })
          })
      })
