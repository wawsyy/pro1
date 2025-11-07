"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

import { useWalletContext } from "@/hooks/useWalletContext";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useFhevm } from "@/fhevm/useFhevm";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import type { FhevmInstance } from "@/fhevm/fhevmTypes";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { EncryptedPredictionPollABI } from "@/abi/EncryptedPredictionPollABI";
import { EncryptedPredictionPollAddresses } from "@/abi/EncryptedPredictionPollAddresses";

type ContractInfo = {
  abi: typeof EncryptedPredictionPollABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

type OptionState = {
  index: number;
  label: string;
  description: string;
  encryptedTally: string;
};

type PollMetadata = {
  name: string;
  headline: string;
  description: string;
  startTime: number;
  endTime: number;
  finalized: boolean;
  decryptionPending: boolean;
  voterCount: number;
  creator: `0x${string}`;
};

function getContractForChain(chainId: number | undefined): ContractInfo {
  if (!chainId) {
    return { abi: EncryptedPredictionPollABI.abi };
  }

  const entry =
    EncryptedPredictionPollAddresses[
      chainId.toString() as keyof typeof EncryptedPredictionPollAddresses
    ];

  if (!entry || entry.address === ethers.ZeroAddress) {
    return { abi: EncryptedPredictionPollABI.abi, chainId };
  }

  return {
    abi: EncryptedPredictionPollABI.abi,
    address: entry.address as `0x${string}`,
    chainId: entry.chainId,
    chainName: entry.chainName,
  };
}

type UseEncryptedPredictionPollState = {
  contractAddress?: `0x${string}`;
  isDeployed: boolean;
  metadata?: PollMetadata;
  options: OptionState[];
  decryptedTallies: Record<number, number>;
  finalizedTallies: Record<number, number>;
  isLoading: boolean;
  isDecrypting: boolean;
  isSubmitting: boolean;
  message: string;
  refresh: () => Promise<void>;
  castVote: (optionIndex: number) => Promise<void>;
  decryptTallies: () => Promise<void>;
  requestOracleDecryption: () => Promise<void>;
  fheStatus: ReturnType<typeof useFhevm>["status"];
  fheError: Error | undefined;
  walletConnected: boolean;
};

async function buildEncryptedInputs(
  instance: FhevmInstance,
  contractAddress: `0x${string}`,
  signer: ethers.JsonRpcSigner,
  optionIndex: number,
) {
  const signerAddress = (await signer.getAddress()) as `0x${string}`;
  const input = instance.createEncryptedInput(contractAddress, signerAddress);
  input.add32(optionIndex);
  return input.encrypt();
}

async function loadSignature(
  instance: FhevmInstance,
  storage: GenericStringStorage,
  contractAddress: `0x${string}`,
  signer: ethers.Signer,
) {
  return FhevmDecryptionSignature.loadOrSign(
    instance,
    [contractAddress],
    signer,
    storage,
  );
}

export function useEncryptedPredictionPoll(): UseEncryptedPredictionPollState {
  const {
    account,
    chainId,
    provider,
    ethersSigner,
    ethersReadonlyProvider,
    isConnected,
    initialMockChains,
  } = useWalletContext();
  const { storage } = useInMemoryStorage();

  const [metadata, setMetadata] = useState<PollMetadata | undefined>(undefined);
  const [options, setOptions] = useState<OptionState[]>([]);
  const [encryptedTallies, setEncryptedTallies] = useState<string[]>([]);
  const [decryptedTallies, setDecryptedTallies] = useState<Record<number, number>>({});
  const [clearTallies, setClearTallies] = useState<Record<number, number>>({});
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  const contractInfo = useMemo(() => getContractForChain(chainId), [chainId]);

  const { instance, status: fheStatus, error: fheError, refresh: refreshFhe } =
    useFhevm({
      provider,
      chainId,
      initialMockChains,
      enabled: Boolean(contractInfo.address),
    });

  const contract = useMemo(() => {
    if (!contractInfo.address || !ethersReadonlyProvider) {
      return undefined;
    }
    return new ethers.Contract(
      contractInfo.address,
      contractInfo.abi,
      ethersReadonlyProvider,
    );
  }, [contractInfo, ethersReadonlyProvider]);

  const refresh = useCallback(async () => {
    if (!contract || !contractInfo.address) {
      setMetadata(undefined);
      setOptions([]);
      setEncryptedTallies([]);
      setMessage(
        "EncryptedPredictionPoll deployment not found on the currently selected chain.",
      );
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const [
        pollName,
        pollHeadline,
        pollDescription,
        startTime,
        endTime,
        finalized,
        decryptionPending,
        voterCount,
        optionCount,
        creator,
      ] = await Promise.all([
        contract.pollName(),
        contract.pollHeadline(),
        contract.pollDescription(),
        contract.startTime(),
        contract.endTime(),
        contract.finalized(),
        contract.decryptionPending(),
        contract.voterCount(),
        contract.optionCount(),
        contract.creator(),
      ]);

      const optionTotal = Number(optionCount);
      const optionEntries: OptionState[] = [];
      const clearResults: Record<number, number> = {};
      const tallyHandles: string[] = [];

      for (let index = 0; index < optionTotal; index++) {
        const optionData = await contract.getOption(index);
        const handle = await contract.getEncryptedTally(index);
        optionEntries.push({
          index,
          label: optionData.label as string,
          description: optionData.description as string,
          encryptedTally: handle,
        });
        tallyHandles.push(handle);

        if (finalized) {
          const clearValue = await contract.getClearTally(index);
          clearResults[index] = Number(clearValue);
        }
      }

      setMetadata({
        name: pollName,
        headline: pollHeadline,
        description: pollDescription,
        startTime: Number(startTime),
        endTime: Number(endTime),
        finalized,
        decryptionPending,
        voterCount: Number(voterCount),
        creator,
      });
      setOptions(optionEntries);
      setEncryptedTallies(tallyHandles);
      setDecryptedTallies({});
      setClearTallies(clearResults);
    } catch (error) {
      console.error("[useEncryptedPredictionPoll] refresh failed", error);
      setMessage("Unable to load poll state. Ensure the contract is deployed and reachable.");
      setMetadata(undefined);
      setOptions([]);
      setEncryptedTallies([]);
      setClearTallies({});
    } finally {
      setIsLoading(false);
    }
  }, [contract, contractInfo.address]);

  useEffect(() => {
    refresh();
  }, [refresh, chainId, contractInfo.address]);

  useEffect(() => {
    // Refresh FHE instance when provider changes
    refreshFhe();
  }, [provider, chainId, refreshFhe]);

  const castVote = useCallback(
    async (optionIndex: number) => {
      if (!contractInfo.address || !ethersSigner || !instance || !account) {
        setMessage("Connect a wallet on a supported network to submit an encrypted vote.");
        return;
      }

      setIsSubmitting(true);
      setMessage("Preparing encrypted payload...");

      try {
        const encryptedInputs = await buildEncryptedInputs(
          instance,
          contractInfo.address,
          ethersSigner,
          optionIndex,
        );

        const connected = new ethers.Contract(
          contractInfo.address,
          contractInfo.abi,
          ethersSigner,
        );

        const tx = await connected.submitEncryptedVote(
          encryptedInputs.handles[0],
          encryptedInputs.inputProof,
        );
        setMessage(`Submitting encrypted ballot... tx: ${tx.hash}`);
        await tx.wait();
        setMessage("Encrypted vote recorded successfully.");
        await refresh();
      } catch (error) {
        console.error("[useEncryptedPredictionPoll] castVote failed", error);
        setMessage("Failed to submit encrypted vote. Check console for details.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [account, contractInfo, ethersSigner, instance, refresh],
  );

  const decryptTallies = useCallback(async () => {
    if (!instance || !ethersSigner || !contractInfo.address) {
      setMessage("Connect a wallet and ensure the FHE runtime is ready before decrypting.");
      return;
    }
    if (!encryptedTallies.length) {
      setMessage("No encrypted tallies available to decrypt yet.");
      return;
    }

    const handles = encryptedTallies
      .map((handle, index) => ({ index, handle }))
      .filter(({ handle }) => handle && handle !== ethers.ZeroHash);

    if (handles.length === 0) {
      setMessage("Tallies are not initialized yet. Cast votes to update them.");
      return;
    }

    setIsDecrypting(true);
    setMessage("Generating FHE decryption signature...");

    // Store address in a const to help TypeScript type narrowing
    const contractAddress = contractInfo.address;

    try {
      const signature = await loadSignature(
        instance,
        storage,
        contractAddress,
        ethersSigner,
      );

      if (!signature) {
        setMessage("Unable to create or load FHE decryption signature.");
        return;
      }

      const result = await instance.userDecrypt(
        handles.map((h) => ({
          handle: h.handle,
          contractAddress: contractAddress,
        })),
        signature.privateKey,
        signature.publicKey,
        signature.signature,
        signature.contractAddresses,
        signature.userAddress,
        signature.startTimestamp,
        signature.durationDays,
      );

      const tallies: Record<number, number> = {};
      handles.forEach(({ index, handle }) => {
        const raw = result[handle];
        tallies[index] = raw ? Number(raw) : 0;
      });

      setDecryptedTallies(tallies);
      setMessage("Tallies decrypted locally with your key material.");
    } catch (error) {
      console.error("[useEncryptedPredictionPoll] decryptTallies failed", error);
      setMessage("Local decryption failed. Ensure the FHE runtime is initialised.");
    } finally {
      setIsDecrypting(false);
    }
  }, [contractInfo.address, encryptedTallies, ethersSigner, instance, storage]);

  const requestOracleDecryption = useCallback(async () => {
    if (!contractInfo.address || !ethersSigner) {
      setMessage("Connect a wallet on a supported network to request oracle decryption.");
      return;
    }
    setMessage("Sending oracle decryption request...");
    try {
      const connected = new ethers.Contract(
        contractInfo.address,
        contractInfo.abi,
        ethersSigner,
      );
      const tx = await connected.requestEncryptedTallyDecryption();
      await tx.wait();
      setMessage("Oracle decryption requested. Await on-chain callback.");
      await refresh();
    } catch (error) {
      console.error("[useEncryptedPredictionPoll] requestOracleDecryption failed", error);
      setMessage("Unable to request oracle decryption at this time.");
    }
  }, [contractInfo.address, ethersSigner, refresh]);

  return {
    contractAddress: contractInfo.address,
    isDeployed: Boolean(contractInfo.address),
    metadata,
    options,
    decryptedTallies,
    finalizedTallies: clearTallies,
    isLoading,
    isDecrypting,
    isSubmitting,
    message,
    refresh,
    castVote,
    decryptTallies,
    requestOracleDecryption,
    fheStatus,
    fheError,
    walletConnected: isConnected,
  };
}

