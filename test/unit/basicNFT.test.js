const { assert } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("BasicNFT", async function () {
          let basicNft
          let deployer
          beforeEach(async () => {
              //deploy our basicNft contract using Hardhat-deploy
              // const accounts = await ethers.getSigners()
              // const accountZero = accounts[0]
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["basicnft"])
              basicNft = await ethers.getContract("BasicNFT", deployer)
          })

          describe("constructor", function () {
              it("sets the token counter correctly", async function () {
                  const response = await basicNft.getTokenCounter()
                  assert.equal(response, "0")
              })
          })

          describe("mintNFT", function () {
              it("Updates the token counter", async () => {
                  const tx = await basicNft.mintNFT()
                  tx.wait(1)
                  const response = await basicNft.getTokenCounter()
                  assert.equal(response, "1")
              })
          })

          describe("tokenURI", function () {
              it("returns the tokenURI", async () => {
                  const tokenURI = await basicNft.TOKEN_URI()
                  console.log(`TokenURI is: ${tokenURI}`)
                  const response = await basicNft.tokenURI(0)
                  assert.equal(tokenURI, response)
              })
          })
      })
